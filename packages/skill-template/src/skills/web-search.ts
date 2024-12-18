import { START, END, StateGraphArgs, StateGraph } from '@langchain/langgraph';
import { z } from 'zod';
import { Runnable, RunnableConfig } from '@langchain/core/runnables';
import { BaseSkill, BaseSkillState, SkillRunnableConfig, baseStateGraphArgs } from '../base';
import { Icon, SkillInvocationConfig, SkillTemplateConfigDefinition } from '@refly-packages/openapi-schema';
import { GraphState } from '../scheduler/types';
import { ModelContextLimitMap, safeStringifyJSON } from '@refly-packages/utils';

// utils
import { buildFinalRequestMessages } from '../scheduler/utils/message';
import { prepareWebSearchContext } from '../scheduler/utils/context';

// prompts
import * as webSearch from '../scheduler/module/webSearch/index';
import { concatMergedContextToStr, flattenMergedContextToSources } from '../scheduler/utils/summarizer';
import { truncateSource } from '../scheduler/utils/truncator';
import { processQuery } from '../scheduler/utils/queryProcessor';

export class WebSearch extends BaseSkill {
  name = 'webSearch';

  icon: Icon = { type: 'emoji', value: '🌐' };

  configSchema: SkillTemplateConfigDefinition = {
    items: [
      {
        key: 'enableDeepReasonWebSearch',
        inputMode: 'switch',
        defaultValue: false,
        labelDict: {
          en: 'Enable Deep Search',
          'zh-CN': '启用深度搜索',
        },
        descriptionDict: {
          en: 'Enable deep search for more comprehensive results',
          'zh-CN': '启用深度搜索以获取更全面的结果',
        },
      },
    ],
  };

  invocationConfig: SkillInvocationConfig = {};

  description = 'Search the web and provide answers based on search results';

  schema = z.object({
    query: z.string().optional().describe('The search query'),
  });

  graphState: StateGraphArgs<BaseSkillState>['channels'] = {
    ...baseStateGraphArgs,
  };

  callWebSearch = async (state: GraphState, config: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    const { messages = [] } = state;
    const { locale = 'en', currentSkill } = config.configurable;

    // Set current step
    config.metadata.step = { name: 'webSearch' };

    // Use shared query processor
    const { optimizedQuery, query, usedChatHistory, remainingTokens } = await processQuery({
      config,
      ctxThis: this,
      state,
    });

    // Perform web search with context preparation
    const webSearchContext = await prepareWebSearchContext(
      { query: optimizedQuery },
      { config, ctxThis: this, state, tplConfig: config.configurable.tplConfig },
    );

    const mergedContext = {
      mentionedContext: null,
      lowerPriorityContext: null,
      webSearchSources: webSearchContext?.processedWebSearchContext?.webSearchSources ?? [],
    };

    const contextStr = concatMergedContextToStr(mergedContext);
    const sources = flattenMergedContextToSources(mergedContext);

    this.engine.logger.log(
      `- contextStr: ${contextStr}
       - sources: ${safeStringifyJSON(sources)}`,
    );

    // Set current step for answer generation
    config.metadata.step = { name: 'answerGeneration' };

    // Build messages for the model
    const module = {
      buildSystemPrompt: webSearch.buildWebSearchSystemPrompt,
      buildContextUserPrompt: webSearch.buildWebSearchContextUserPrompt,
      buildUserPrompt: webSearch.buildWebSearchUserPrompt,
    };

    this.engine.logger.log(`Prepared context successfully! ${safeStringifyJSON(webSearchContext)}`);

    if (sources.length > 0) {
      this.emitEvent({ structuredData: { sources: truncateSource(sources) } }, config);
    }

    const requestMessages = buildFinalRequestMessages({
      module,
      locale,
      chatHistory: usedChatHistory,
      messages,
      needPrepareContext: true,
      context: contextStr,
      originalQuery: query,
      rewrittenQuery: optimizedQuery,
    });

    this.engine.logger.log(`Request messages: ${safeStringifyJSON(requestMessages)}`);

    // Generate answer using the model
    const model = this.engine.chatModel({ temperature: 0.1 });
    const responseMessage = await model.invoke(requestMessages, {
      ...config,
      metadata: {
        ...config.metadata,
        ...currentSkill,
      },
    });

    this.engine.logger.log(`Response message: ${safeStringifyJSON(responseMessage)}`);

    return { messages: [responseMessage] };
  };

  toRunnable(): Runnable<any, any, RunnableConfig> {
    const workflow = new StateGraph<BaseSkillState>({
      channels: this.graphState,
    }).addNode('webSearch', this.callWebSearch);

    workflow.addEdge(START, 'webSearch');
    workflow.addEdge('webSearch', END);

    return workflow.compile();
  }
}
