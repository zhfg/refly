import { BaseMessage } from '@langchain/core/messages';
import { START, END, StateGraphArgs, StateGraph } from '@langchain/langgraph';

// schema
import { z } from 'zod';
// types
import { Runnable, RunnableConfig } from '@langchain/core/runnables';
import { BaseSkill, BaseSkillState, SkillRunnableConfig, baseStateGraphArgs } from '../base';
import { safeStringifyJSON } from '@refly-packages/utils';
import { Icon, SkillInvocationConfig, SkillTemplateConfigSchema } from '@refly-packages/openapi-schema';
import { ToolCall } from '@langchain/core/dist/messages/tool';
import { CanvasIntentType } from '@refly-packages/common-types';
// types
import { GraphState, IContext } from '../scheduler/types';
// utils
import { prepareContext } from '../scheduler/utils/context';
import { analyzeQueryAndContext, preprocessQuery } from '../scheduler/utils/queryRewrite';
import { truncateMessages } from '../scheduler/utils/truncator';
import { countMessagesTokens, countToken, ModelContextLimitMap, checkHasContext } from '../scheduler/utils/token';
import { buildFinalRequestMessages, SkillPromptModule } from '../scheduler/utils/message';

// prompts
import * as generateDocument from '../scheduler/module/generateDocument';

export class GenerateDoc extends BaseSkill {
  name = 'generate_doc';

  displayName = {
    en: 'Generate Document',
    'zh-CN': '生成文档',
  };

  icon: Icon = { type: 'emoji', value: '📝' };

  configSchema: SkillTemplateConfigSchema = {
    items: [],
  };

  invocationConfig: SkillInvocationConfig = {};

  description = "Inference user's intent and run related skill";

  schema = z.object({
    query: z.string().optional().describe('The search query'),
  });

  graphState: StateGraphArgs<BaseSkillState>['channels'] = {
    ...baseStateGraphArgs,
  };

  commonPreprocess = async (state: GraphState, config: SkillRunnableConfig, module: SkillPromptModule) => {
    const { messages = [], query: originalQuery } = state;
    const {
      locale = 'en',
      chatHistory = [],
      modelName,
      resources,
      documents,
      contentList,
      projects,
    } = config.configurable;

    const { tplConfig } = config?.configurable || {};
    const enableWebSearch = tplConfig?.enableWebSearch?.value as boolean;
    const enableKnowledgeBaseSearch = tplConfig?.enableKnowledgeBaseSearch?.value as boolean;

    let optimizedQuery = '';
    let mentionedContext: IContext;
    let context: string = '';

    // preprocess query, ensure query is not too long
    const query = preprocessQuery(originalQuery, {
      config: config,
      ctxThis: this,
      state: state,
      tplConfig,
    });
    optimizedQuery = query;
    this.engine.logger.log(`preprocess query: ${query}`);

    // preprocess chat history, ensure chat history is not too long
    const usedChatHistory = truncateMessages(chatHistory);

    // check if there is any context
    const hasContext = checkHasContext({
      contentList,
      resources,
      documents,
      projects: projects,
    });
    this.engine.logger.log(`checkHasContext: ${hasContext}`);

    const maxTokens = ModelContextLimitMap[modelName];
    const queryTokens = countToken(query);
    const chatHistoryTokens = countMessagesTokens(usedChatHistory);
    const remainingTokens = maxTokens - queryTokens - chatHistoryTokens;
    this.engine.logger.log(
      `maxTokens: ${maxTokens}, queryTokens: ${queryTokens}, chatHistoryTokens: ${chatHistoryTokens}, remainingTokens: ${remainingTokens}`,
    );

    // 新增：定义长查询的阈值（可以根据实际需求调整）
    const LONG_QUERY_TOKENS_THRESHOLD = 100; // 约等于50-75个英文单词或25-35个中文字

    // 优化 needRewriteQuery 判断逻辑
    const needRewriteQuery =
      queryTokens < LONG_QUERY_TOKENS_THRESHOLD && // 只有短查询才需要重写
      (hasContext || chatHistoryTokens > 0); // 保持原有的上下文相关判断

    const needPrepareContext = (hasContext && remainingTokens > 0) || enableWebSearch || enableKnowledgeBaseSearch;
    this.engine.logger.log(`needRewriteQuery: ${needRewriteQuery}, needPrepareContext: ${needPrepareContext}`);

    if (needRewriteQuery) {
      const analyedRes = await analyzeQueryAndContext(query, {
        config,
        ctxThis: this,
        state: state,
        tplConfig,
      });
      optimizedQuery = analyedRes.optimizedQuery;
      mentionedContext = analyedRes.mentionedContext;
    }

    this.engine.logger.log(`optimizedQuery: ${optimizedQuery}`);
    this.engine.logger.log(`mentionedContext: ${safeStringifyJSON(mentionedContext)}`);

    if (needPrepareContext) {
      context = await prepareContext(
        {
          query: optimizedQuery,
          mentionedContext,
          maxTokens: remainingTokens,
          hasContext,
        },
        {
          config: config,
          ctxThis: this,
          state: state,
          tplConfig,
        },
      );
    }

    this.engine.logger.log(`context: ${safeStringifyJSON(context)}`);

    const requestMessages = buildFinalRequestMessages({
      module,
      locale,
      chatHistory: usedChatHistory,
      messages,
      needPrepareContext,
      context,
      originalQuery: query,
      rewrittenQuery: optimizedQuery,
    });

    this.engine.logger.log(`requestMessages: ${safeStringifyJSON(requestMessages)}`);

    return { requestMessages };
  };

  callGenerateDoc = async (state: GraphState, config: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    this.emitEvent({ event: 'log', content: `Start to call generate document...` }, config);

    const { currentSkill } = config?.configurable || {};
    const { user } = config;

    // Create document first
    const res = await this.engine.service.createDocument(user, {
      title: '',
      initialContent: '',
    });

    // Emit intent matcher event
    this.emitEvent(
      {
        event: 'structured_data',
        structuredDataKey: 'intentMatcher',
        content: JSON.stringify({
          type: CanvasIntentType.GenerateDocument,
          docId: res.data?.docId || '',
        }),
      },
      config,
    );

    const model = this.engine.chatModel({ temperature: 0.1 });

    const module = {
      buildSystemPrompt: generateDocument.buildGenerateCanvasSystemPrompt,
      buildUserPrompt: generateDocument.buildGenerateCanvasUserPrompt,
      buildContextUserPrompt: generateDocument.buildGenerateCanvasContextUserPrompt,
    };
    const { requestMessages } = await this.commonPreprocess(state, config, module);

    this.emitEvent({ event: 'log', content: `Start to generate canvas...` }, config);

    const responseMessage = await model.invoke(requestMessages, {
      ...config,
      metadata: {
        ...config.metadata,
        ...currentSkill,
      },
    });

    this.engine.logger.log(`responseMessage: ${safeStringifyJSON(responseMessage)}`);
    this.emitEvent({ event: 'log', content: `Generated canvas successfully!` }, config);

    return { messages: [responseMessage] };
  };

  toRunnable(): Runnable<any, any, RunnableConfig> {
    const workflow = new StateGraph<GraphState>({
      channels: this.graphState,
    })
      .addNode('generateCanvas', this.callGenerateDoc)
      .addEdge(START, 'generateCanvas')
      .addEdge('generateCanvas', END);

    return workflow.compile();
  }
}
