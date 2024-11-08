import { SkillRunnableConfig, BaseSkill } from '../../../base';
import { GraphState } from '../../types';
import { TimeTracker } from '@refly-packages/utils';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { Source } from '@refly-packages/openapi-schema';

import { buildRewriteQuerySystemPrompt, buildRewriteQueryUserPrompt, rewriteQueryOutputSchema } from './rewriteQuery';
import {
  buildTranslateQuerySystemPrompt,
  buildTranslateQueryUserPrompt,
  translateQueryOutputSchema,
} from './translateQuery';
import { mergeSearchResults, searchResultsToSources, sourcesToSearchResults } from '@refly-packages/utils';
import { translateResults } from './translateResult';
import { performConcurrentWebSearch } from './webSearch';

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
export const callMultiLingualWebSearch = async (ctx: {
  config: SkillRunnableConfig;
  ctxThis: BaseSkill;
  state: GraphState;
}): Promise<{ sources: Source[] }> => {
  const { config, ctxThis, state } = ctx;
  const { engine } = ctxThis;
  const { tplConfig } = config?.configurable || {};

  const { query } = state;

  // TODO: 针对在 scheduler 里面调用,
  const searchLocaleList = (tplConfig?.searchLocaleList?.value as string[]) || ['en', 'zh-CN', 'ja'];
  const resultDisplayLocale = (tplConfig?.resultDisplayLocale?.value as string) || 'auto';
  const enableRerank = (tplConfig?.enableRerank?.value as boolean) || false;
  const enableTranslate = (tplConfig?.enableTranslate?.value as boolean) || false;
  const searchLimit = (tplConfig?.searchLimit?.value as number) || 10;
  const rerankRelevanceThreshold = (tplConfig?.rerankRelevanceThreshold?.value as number) || 0.1;
  const rerankLimit = tplConfig?.rerankLimit?.value as number;
  const translateConcurrencyLimit = (tplConfig?.translateConcurrencyLimit?.value as number) || 10;
  const webSearchConcurrencyLimit = (tplConfig?.webSearchConcurrencyLimit?.value as number) || 3;
  const batchSize = (tplConfig?.batchSize?.value as number) || 5;

  const timeTracker = new TimeTracker();
  let finalResults: Source[] = [];

  const model = engine.chatModel({ temperature: 0.1 });

  try {
    // Step 1: Rewrite query
    timeTracker.startStep('rewriteQuery');
    const rewriteResult = await model.withStructuredOutput(rewriteQueryOutputSchema).invoke(
      [
        new SystemMessage(buildRewriteQuerySystemPrompt()),
        new HumanMessage(
          buildRewriteQueryUserPrompt({
            query,
            resultDisplayLocale,
          }),
        ),
      ],
      config,
    );
    const rewriteDuration = timeTracker.endStep('rewriteQuery');
    engine.logger.log(`Rewrite queries completed in ${rewriteDuration}ms`);
    ctxThis.emitEvent({ event: 'log', content: `Rewrite queries completed in ${rewriteDuration}ms` }, config);

    // Determine display locale
    const displayLocale =
      resultDisplayLocale === 'auto' ? rewriteResult.analysis.recommendedDisplayLocale : resultDisplayLocale;

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
            },
          },
        ]),
        structuredDataKey: 'multiLingualSearchStepUpdate',
      },
      config,
    );

    // Step 2: Translate query
    timeTracker.startStep('translateQuery');
    const translateResult = await model.withStructuredOutput(translateQueryOutputSchema).invoke(
      [
        new SystemMessage(buildTranslateQuerySystemPrompt()),
        new HumanMessage(
          buildTranslateQueryUserPrompt({
            queries: rewriteResult.queries.rewrittenQueries,
            searchLocaleList,
            sourceLocale: rewriteResult.analysis.detectedQueryLocale,
          }),
        ),
      ],
      config,
    );
    const translateDuration = timeTracker.endStep('translateQuery');
    engine.logger.log(`Translate queries completed in ${translateDuration}ms`);
    ctxThis.emitEvent({ event: 'log', content: `Translate queries completed in ${translateDuration}ms` }, config);

    ctxThis.emitEvent(
      {
        event: 'structured_data',
        content: JSON.stringify([
          {
            step: 'translateQuery',
            duration: translateDuration,
            result: {
              translatedQueries: translateResult?.translations || [],
            },
          },
        ]),
        structuredDataKey: 'multiLingualSearchStepUpdate',
      },
      config,
    );

    // Prepare query map for concurrent search
    const queryMap: Record<string, string[]> = {};
    for (const locale of searchLocaleList) {
      queryMap[locale] = translateResult.translations[locale] || rewriteResult.queries.rewrittenQueries;
    }

    // Step 3: Perform concurrent web search
    timeTracker.startStep('webSearch');
    const allResults = await performConcurrentWebSearch({
      queryMap,
      searchLimit,
      concurrencyLimit: webSearchConcurrencyLimit,
      user: config.user,
      engine: engine,
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

    if (enableTranslate) {
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
