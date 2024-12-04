import { SkillRunnableConfig, BaseSkill } from '../../../base';
import { GraphState } from '../../types';
import { deduplicateSourcesByTitle, TimeTracker, translateText, batchTranslateText } from '@refly-packages/utils';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { Source } from '@refly-packages/openapi-schema';

import { buildRewriteQuerySystemPrompt, buildRewriteQueryUserPrompt, rewriteQueryOutputSchema } from './rewriteQuery';
import { mergeSearchResults, searchResultsToSources, sourcesToSearchResults } from '@refly-packages/utils';
import { translateResults } from './translateResult';
import { performConcurrentWebSearch } from './webSearch';
import { getOptimizedSearchLocales, normalizeLocale } from './locale';

/**
 * 目标：
 * 1. 基于用户输入的 query，结合 searchLocaleList 和 resultDisplayLocale，进行多轮搜索，得到最终的 sources
 * 2. 返回 sources 给前端进行展示
 *
 * 输入：
 * 1. 选择 searchLocaleList: string[], 和结果展示的 resultDisplayLocale: string | auto
 * 2. 输入查询 Query
 *
 * 输出：
 * 1. 多步推理：
 * 1.1 rewrite to multi query：比如存在多个意图，则需要拆分为多个 query 或者将不完整的某个意图补充完整
 * 1.2 基于 searchLocaleList 将 rewrite 后的 query 翻译为多语言，然后合并成一组 list query
 * 1.3 基于 list query 进行多轮搜索，得到初始的 sources
 * 1.4 将初始的 sources(title、description/snippet) 翻译为 resultDisplayLocale 对应的语言，整体组成 list sources
 * 1.5 基于 list sources 进行 rerank 排序生成最终的 sources 并返回
 *
 */

interface CallMultiLingualWebSearchParams {
  searchLimit: number;
  searchLocaleList: string[];
  resultDisplayLocale: string;
  enableRerank: boolean;
  enableTranslateQuery: boolean;
  enableTranslateResult: boolean;
  rerankRelevanceThreshold?: number;
  rerankLimit?: number;
  translateConcurrencyLimit: number;
  webSearchConcurrencyLimit: number;
  batchSize: number;
  enableDeepReasonWebSearch: boolean;
}

export const callMultiLingualWebSearch = async (
  params: CallMultiLingualWebSearchParams,
  ctx: {
    config: SkillRunnableConfig;
    ctxThis: BaseSkill;
    state: GraphState;
  },
): Promise<{ sources: Source[] }> => {
  const { config, ctxThis, state } = ctx;
  const { engine } = ctxThis;

  const { query } = state;

  // TODO: 针对在 scheduler 里面调用,
  let searchLocaleList = params.searchLocaleList || ['en'];
  const resultDisplayLocale = params.resultDisplayLocale || 'auto';
  const enableRerank = params.enableRerank || false;
  const enableTranslateQuery = params.enableTranslateQuery || false;
  const enableTranslateResult = params.enableTranslateResult || false;
  const searchLimit = params.searchLimit || 10;
  const rerankRelevanceThreshold = params.rerankRelevanceThreshold || 0.1;
  const rerankLimit = params.rerankLimit;
  const translateConcurrencyLimit = params.translateConcurrencyLimit || 10;
  const webSearchConcurrencyLimit = params.webSearchConcurrencyLimit || 3;
  const batchSize = params.batchSize || 5;
  const enableDeepReasonWebSearch = params.enableDeepReasonWebSearch || false;
  const timeTracker = new TimeTracker();
  let finalResults: Source[] = [];

  const model = engine.chatModel({ temperature: 0.1 });

  try {
    // Step 1: Rewrite query
    // TODO: 同时在 deepReasonSearch 和非 deepReasonSearch 下应该应用不同的改写设计（比如 deepReasonSearch 会拆分为更多个 query）
    timeTracker.startStep('rewriteQuery');
    const rewriteResult = await model.withStructuredOutput(rewriteQueryOutputSchema).invoke(
      [
        new SystemMessage(buildRewriteQuerySystemPrompt()),
        new HumanMessage(
          buildRewriteQueryUserPrompt({
            query,
          }),
        ),
      ],
      config,
    );
    const rewriteDuration = timeTracker.endStep('rewriteQuery');
    engine.logger.log(`Rewrite queries completed in ${rewriteDuration}ms`);
    ctxThis.emitEvent(
      {
        event: 'log',
        content: `Rewrite queries completed in ${rewriteDuration}ms, rewrittenQueries: ${rewriteResult.queries.rewrittenQueries}`,
      },
      config,
    );

    // Determine display locale
    const displayLocale = resultDisplayLocale;
    const searchLocaleListLen = enableDeepReasonWebSearch ? 3 : 2;
    const optimizedSearchLocales = getOptimizedSearchLocales(displayLocale, searchLocaleListLen);
    searchLocaleList = optimizedSearchLocales;

    engine.logger.log(`Search analysis: ${JSON.stringify(rewriteResult.analysis)}`);
    engine.logger.log(`Recommended display locale: ${displayLocale}`);

    ctxThis.emitEvent(
      {
        event: 'structured_data',
        content: JSON.stringify([
          {
            step: 'rewriteQuery',
            duration: rewriteDuration,
            result: {
              rewrittenQueries: rewriteResult?.queries?.rewrittenQueries || [],
              outputLocale: displayLocale,
              searchLocales: searchLocaleList,
              enableDeepReasonWebSearch,
            },
          },
        ]),
        structuredDataKey: 'multiLingualSearchStepUpdate',
      },
      config,
    );

    // Step 2: Translate query (if enabled)
    const queryMap: Record<string, string[]> = {};

    // TODO: try/catch 处理报错，如果报错，则不进行翻译，走和 else 一样的流程
    if (enableTranslateQuery) {
      timeTracker.startStep('translateQuery');
      try {
        // 构建翻译结果对象
        const translations: Record<string, string[]> = {};

        // 为每个目标语言进行翻译
        for (const targetLocale of searchLocaleList) {
          // 使用标准化的 locale 进行比较
          if (normalizeLocale(targetLocale) === normalizeLocale(resultDisplayLocale)) {
            queryMap[targetLocale] = rewriteResult.queries.rewrittenQueries;
            continue;
          }

          // 批量翻译查询，使用标准化的 locale 进行翻译
          const translatedQueries = await batchTranslateText(
            rewriteResult.queries.rewrittenQueries,
            normalizeLocale(targetLocale),
            normalizeLocale(resultDisplayLocale),
          );
          queryMap[targetLocale] = translatedQueries;
        }

        const translateQueryDuration = timeTracker.endStep('translateQuery');
        engine.logger.log(`Translate query completed in ${translateQueryDuration}ms`);

        ctxThis.emitEvent(
          { event: 'log', content: `Translate query completed in ${translateQueryDuration}ms` },
          config,
        );

        ctxThis.emitEvent(
          {
            event: 'structured_data',
            content: JSON.stringify([
              {
                step: 'translateQuery',
                duration: translateQueryDuration,
                result: {
                  translatedQueries: queryMap,
                  enableTranslateQuery: true,
                },
              },
            ]),
            structuredDataKey: 'multiLingualSearchStepUpdate',
          },
          config,
        );
      } catch (error) {
        engine.logger.error(`Error in query translation: ${error.stack}`);
        // 翻译失败时，使用原始查询
        for (const locale of searchLocaleList) {
          queryMap[locale] = rewriteResult.queries.rewrittenQueries;
        }

        ctxThis.emitEvent(
          {
            event: 'structured_data',
            content: JSON.stringify([
              {
                step: 'translateQuery',
                duration: 0,
                result: {
                  translatedQueries: queryMap,
                  enableTranslateQuery: false,
                },
              },
            ]),
            structuredDataKey: 'multiLingualSearchStepUpdate',
          },
          config,
        );
      }
    } else {
      // If translation is disabled, use original queries for all locales
      for (const locale of searchLocaleList) {
        queryMap[locale] = rewriteResult.queries.rewrittenQueries;
      }

      ctxThis.emitEvent(
        {
          event: 'structured_data',
          content: JSON.stringify([
            {
              step: 'translateQuery',
              duration: 0,
              result: {
                translatedQueries: queryMap,
                enableTranslateQuery: false,
              },
            },
          ]),
          structuredDataKey: 'multiLingualSearchStepUpdate',
        },
        config,
      );
    }

    // Step 3: Perform concurrent web search
    timeTracker.startStep('webSearch');
    const allResults = await performConcurrentWebSearch({
      queryMap,
      searchLimit,
      concurrencyLimit: webSearchConcurrencyLimit,
      user: config.configurable.user,
      engine: engine,
      enableTranslateQuery,
    });
    const webSearchDuration = timeTracker.endStep('webSearch');
    engine.logger.log(`Web search completed in ${webSearchDuration}ms`);
    ctxThis.emitEvent({ event: 'log', content: `Web search completed in ${webSearchDuration}ms` }, config);
    const mergedResults = mergeSearchResults(allResults);

    finalResults = mergedResults;

    ctxThis.emitEvent(
      {
        event: 'structured_data',
        content: JSON.stringify([
          {
            step: 'webSearch',
            duration: webSearchDuration,
            result: {
              length: mergedResults?.length,
              localeLength: searchLocaleList?.length,
            },
          },
        ]),
        structuredDataKey: 'multiLingualSearchStepUpdate',
      },
      config,
    );

    ctxThis.emitEvent(
      {
        event: 'log',
        content: `Web search completed in ${webSearchDuration}ms, total results: ${mergedResults?.length}`,
      },
      config,
    );

    if (enableTranslateResult) {
      // Step 4: Translate merged results to display locale
      timeTracker.startStep('translateResults');
      const translatedResults = await translateResults({
        sources: mergedResults,
        targetLocale: displayLocale,
        model,
        config,
        concurrencyLimit: translateConcurrencyLimit,
        batchSize,
      });
      const translateResultsDuration = timeTracker.endStep('translateResults');
      engine.logger.log(`Translate results completed in ${translateResultsDuration}ms`);
      ctxThis.emitEvent(
        { event: 'log', content: `Translate results completed in ${translateResultsDuration}ms` },
        config,
      );

      ctxThis.emitEvent(
        {
          event: 'structured_data',
          content: JSON.stringify([
            {
              step: 'translateResults',
              duration: translateResultsDuration,
              result: {
                length: mergedResults?.length,
                localeLength: searchLocaleList?.length,
              },
            },
          ]),
          structuredDataKey: 'multiLingualSearchStepUpdate',
        },
        config,
      );

      // Map translated results back to Source format
      // TODO: 这里需要记录 original locale 和 translated locale
      const translatedSources = translatedResults.translations.map((translation, index) => ({
        ...mergedResults[index],
        title: translation.title,
        pageContent: translation.snippet,
        url: translation.originalUrl,
        metadata: {
          originalLocale: mergedResults[index]?.metadata?.originalLocale,
          translatedDisplayLocale: displayLocale,
        },
      }));

      finalResults = translatedSources;
    }

    if (enableRerank) {
      // Step 5: Rerank results
      timeTracker.startStep('rerank');
      try {
        // Convert translated sources to search results format
        const searchResults = sourcesToSearchResults(finalResults);

        // Perform reranking
        const rerankResponse = await engine.service.rerank(query, searchResults, {
          topN: rerankLimit || searchResults.length,
          relevanceThreshold: rerankRelevanceThreshold,
        });

        // Convert back to Source format
        finalResults = searchResultsToSources(rerankResponse.data);

        engine.logger.log(`Reranked results count: ${finalResults.length}`);
      } catch (error) {
        engine.logger.error(`Error in reranking: ${error.stack}`);
        // Fallback to translated sources without reranking
      }
      const rerankDuration = timeTracker.endStep('rerank');
      engine.logger.log(`Rerank completed in ${rerankDuration}ms`);
      ctxThis.emitEvent({ event: 'log', content: `Rerank completed in ${rerankDuration}ms` }, config);

      ctxThis.emitEvent(
        {
          event: 'structured_data',
          content: JSON.stringify([
            {
              step: 'rerank',
              duration: rerankDuration,
              result: {
                length: finalResults?.length,
              },
            },
          ]),
          structuredDataKey: 'multiLingualSearchStepUpdate',
        },
        config,
      );
    }

    const stepSummary = timeTracker.getSummary();
    const totalDuration = stepSummary.totalDuration;
    engine.logger.log(`Total duration: ${totalDuration}`);
    ctxThis.emitEvent({ event: 'log', content: `Total duration: ${totalDuration}` }, config);

    ctxThis.emitEvent(
      {
        event: 'structured_data',
        content: JSON.stringify([
          {
            step: 'finish',
            duration: totalDuration,
            result: {},
          },
        ]),
        structuredDataKey: 'multiLingualSearchStepUpdate',
      },
      config,
    );

    engine.logger.log(`Reranked results count: before: ${finalResults.length}`);

    // Deduplicate sources by title
    finalResults = deduplicateSourcesByTitle(finalResults);

    engine.logger.log(`Deduplicated results count: ${finalResults.length}`);

    ctxThis.emitEvent(
      {
        event: 'structured_data',
        content: JSON.stringify(finalResults),
        structuredDataKey: 'multiLingualSearchResult',
      },
      config,
    );

    // Return results with analysis
    return {
      sources: finalResults,
    };
  } catch (error) {
    engine.logger.error(`Error in multilingual search: ${error.stack}`);
    throw error;
  }
};
