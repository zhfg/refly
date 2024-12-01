import { START, END, StateGraphArgs, StateGraph } from '@langchain/langgraph';
import { z } from 'zod';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { Runnable, RunnableConfig } from '@langchain/core/runnables';
import { BaseSkill, BaseSkillState, SkillRunnableConfig, baseStateGraphArgs } from '../base';
import { Icon, SkillInvocationConfig, SkillTemplateConfigDefinition } from '@refly-packages/openapi-schema';
import { GraphState } from '../scheduler/types';
import { ModelContextLimitMap, safeStringifyJSON } from '@refly-packages/utils';

import { buildFinalRequestMessages } from '../scheduler/utils/message';

// prompts
import * as webSearch from '../scheduler/module/webSearch/index';
import { prepareContext } from '../scheduler/utils/context';
import { preprocessQuery } from '../scheduler/utils/queryRewrite';
import { countMessagesTokens } from '../scheduler/utils/token';
import { truncateMessages } from '../scheduler/utils/truncator';
import { countToken } from '../scheduler/utils/token';
import * as librarySearch from '../scheduler/module/librarySearch';

const stepTitleDict = {
  librarySearch: {
    en: 'Library Search',
    'zh-CN': '知识库搜索',
  },
  answerGeneration: {
    en: 'Answer Generation',
    'zh-CN': '生成答案',
  },
};

export class LibrarySearch extends BaseSkill {
  name = 'library_search';

  displayName = {
    en: 'Library Search',
    'zh-CN': '知识库搜索',
  };

  icon: Icon = { type: 'emoji', value: '🔍' };

  configSchema: SkillTemplateConfigDefinition = {
    items: [],
  };

  invocationConfig: SkillInvocationConfig = {};

  description = 'Search the library and provide answers based on search results';

  schema = z.object({
    query: z.string().optional().describe('The search query'),
  });

  graphState: StateGraphArgs<BaseSkillState>['channels'] = {
    ...baseStateGraphArgs,
  };

  callLibrarySearch = async (state: GraphState, config: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    this.emitEvent({ event: 'log', content: `Start library search...` }, config);

    const { messages = [], query: originalQuery } = state;
    const { locale = 'en', uiLocale = 'en', chatHistory = [], modelName, currentSkill } = config.configurable;

    // Set current step
    config.metadata.step = {
      name: 'librarySearch',
      title: stepTitleDict.librarySearch[uiLocale],
    };

    // Preprocess query and ensure it's not too long
    const query = preprocessQuery(originalQuery, {
      config,
      ctxThis: this,
      state,
      tplConfig: config.configurable.tplConfig,
    });

    // Preprocess chat history
    const usedChatHistory = truncateMessages(chatHistory);

    // Calculate token limits
    const maxTokens = ModelContextLimitMap[modelName];
    const queryTokens = countToken(query);
    const chatHistoryTokens = countMessagesTokens(usedChatHistory);
    const remainingTokens = maxTokens - queryTokens - chatHistoryTokens;

    config.configurable.tplConfig = {
      ...config.configurable.tplConfig,
      // Force enable knowledge base search and disable web search
      enableWebSearch: { value: false, label: 'Web Search', displayValue: 'false' },
      enableKnowledgeBaseSearch: { value: true, label: 'Knowledge Base Search', displayValue: 'true' },
      enableSearchWholeSpace: { value: true, label: 'Search Whole Space', displayValue: 'true' },
    };

    // Prepare context with library search focus
    const librarySearchContext = await prepareContext(
      {
        query,
        mentionedContext: {
          contentList: [],
          resources: [],
          documents: [],
          projects: [],
        },
        maxTokens: remainingTokens,
        enableMentionedContext: false,
        enableLowerPriorityContext: true,
      },
      {
        config,
        ctxThis: this,
        state,
        tplConfig: config.configurable.tplConfig,
      },
    );

    const { contextStr, sources } = librarySearchContext;

    this.emitEvent(
      {
        event: 'structured_data',
        content: JSON.stringify(sources),
        structuredDataKey: 'sources',
      },
      config,
    );

    // Set current step for answer generation
    config.metadata.step = {
      name: 'answerGeneration',
      title: stepTitleDict.answerGeneration[uiLocale],
    };

    // Build messages for the model
    const module = {
      buildSystemPrompt: librarySearch.buildLibrarySearchSystemPrompt,
      buildContextUserPrompt: librarySearch.buildLibrarySearchContextUserPrompt,
      buildUserPrompt: librarySearch.buildLibrarySearchUserPrompt,
    };

    const requestMessages = buildFinalRequestMessages({
      module,
      locale,
      chatHistory: usedChatHistory,
      messages,
      needPrepareContext: true,
      context: contextStr,
      originalQuery: query,
      rewrittenQuery: query,
    });

    // Generate answer using the model
    const model = this.engine.chatModel({ temperature: 0.1 });
    const responseMessage = await model.invoke(requestMessages, {
      ...config,
      metadata: {
        ...config.metadata,
        ...currentSkill,
      },
    });

    return { messages: [responseMessage] };
  };

  toRunnable(): Runnable<any, any, RunnableConfig> {
    const workflow = new StateGraph<BaseSkillState>({
      channels: this.graphState,
    }).addNode('librarySearch', this.callLibrarySearch);

    workflow.addEdge(START, 'librarySearch');
    workflow.addEdge('librarySearch', END);

    return workflow.compile();
  }
}
