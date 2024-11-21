import { BaseMessage } from '@langchain/core/messages';
import { START, END, StateGraphArgs, StateGraph } from '@langchain/langgraph';

// schema
import { z } from 'zod';
// types
import { SystemMessage } from '@langchain/core/messages';
import { HumanMessage } from '@langchain/core/messages';
import { Runnable, RunnableConfig } from '@langchain/core/runnables';
import { BaseSkill, SkillRunnableConfig, baseStateGraphArgs } from '../base';
import { CanvasEditConfig, safeStringifyJSON } from '@refly-packages/utils';
import { Icon, SkillInvocationConfig, SkillTemplateConfigSchema } from '@refly-packages/openapi-schema';
import { CanvasIntentType } from '@refly-packages/common-types';
// types
import { GraphState, IContext } from './types';
// utils
import { prepareContext } from './utils/context';
import { analyzeQueryAndContext, preprocessQuery } from './utils/queryRewrite';
import { truncateMessages } from './utils/truncator';
import { countMessagesTokens, countToken, ModelContextLimitMap, checkHasContext } from './utils/token';
import { buildFinalRequestMessages, SkillPromptModule } from './utils/message';

// prompts
import * as canvasIntentMatcher from './module/canvasIntentMatcher';
import * as generateCanvas from './module/generateDocument';
import * as rewriteCanvas from './module/rewriteCanvas';
import * as editCanvas from './module/editCanvas';
import * as commonQnA from './module/commonQnA';

// types
import { HighlightSelection, SelectedRange } from './module/editCanvas/types';

import { InPlaceEditType } from '@refly-packages/utils';
import { DocumentNotFoundError } from '@refly-packages/errors';
export class Scheduler extends BaseSkill {
  name = 'scheduler';

  displayName = {
    en: 'Knowledge Curator',
    'zh-CN': 'Refly 知识管家',
  };

  icon: Icon = { type: 'emoji', value: '🧙‍♂️' };

  configSchema: SkillTemplateConfigSchema = {
    items: [
      {
        key: 'enableWebSearch',
        inputMode: 'radio',
        labelDict: {
          en: 'Web Search',
          'zh-CN': '全网搜索',
        },
        descriptionDict: {
          en: 'Enable web search',
          'zh-CN': '启用全网搜索',
        },
        defaultValue: true,
      },
      {
        key: 'enableDeepReasonWebSearch',
        inputMode: 'radio',
        labelDict: {
          en: 'Deep Web Search',
          'zh-CN': '深度网页搜索',
        },
        descriptionDict: {
          en: 'Enable deep web search',
          'zh-CN': '启用深度网页搜索',
        },
        defaultValue: false,
      },
      {
        key: 'enableKnowledgeBaseSearch',
        inputMode: 'radio',
        labelDict: {
          en: 'Knowledge Base Search',
          'zh-CN': '知识库搜索',
        },
        descriptionDict: {
          en: 'Enable knowledge base search',
          'zh-CN': '启用知识库搜索',
        },
        defaultValue: true,
      },
    ],
  };

  invocationConfig: SkillInvocationConfig = {};

  description = "Inference user's intent and run related skill";

  schema = z.object({
    query: z.string().optional().describe('The search query'),
  });

  graphState: StateGraphArgs<GraphState>['channels'] = {
    ...baseStateGraphArgs,
    messages: {
      reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
      default: () => [],
    },
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

  callGenerateCanvas = async (state: GraphState, config: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    this.emitEvent({ event: 'log', content: `Start to call generate canvas...` }, config);

    const { convId, currentSkill, spanId } = config?.configurable || {};
    const { user } = config;

    // Create canvas first
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
          convId,
        }),
      },
      config,
    );

    const model = this.engine.chatModel({ temperature: 0.1 });

    const module = {
      buildSystemPrompt: generateCanvas.buildGenerateCanvasSystemPrompt,
      buildUserPrompt: generateCanvas.buildGenerateCanvasUserPrompt,
      buildContextUserPrompt: generateCanvas.buildGenerateCanvasContextUserPrompt,
    };
    const { requestMessages } = await this.commonPreprocess(state, config, module);

    this.emitEvent({ event: 'log', content: `Start to generate canvas...` }, config);

    const responseMessage = await model.invoke(requestMessages, {
      ...config,
      metadata: {
        ...config.metadata,
        ...currentSkill,
        spanId,
      },
    });

    this.engine.logger.log(`responseMessage: ${safeStringifyJSON(responseMessage)}`);
    this.emitEvent({ event: 'log', content: `Generated canvas successfully!` }, config);

    return { messages: [responseMessage] };
  };

  callRewriteCanvas = async (state: GraphState, config: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    const { messages = [], query: originalQuery } = state;

    const { chatHistory = [], currentSkill, spanId, convId, documents } = config.configurable;

    this.emitEvent({ event: 'log', content: `Start to rewrite canvas...` }, config);

    const currentDoc = documents?.find((canvas) => canvas?.metadata?.isCurrentContext);

    // send intent matcher event
    this.emitEvent(
      {
        event: 'structured_data',
        structuredDataKey: 'intentMatcher',
        content: JSON.stringify({
          type: CanvasIntentType.RewriteDocument,
          docId: currentDoc?.docId || '',
          convId,
        }),
      },
      config,
    );

    const model = this.engine.chatModel({ temperature: 0.1 });

    const rewriteCanvasUserPrompt = rewriteCanvas.rewriteCanvasUserPrompt(originalQuery);
    const rewriteCanvasContext = rewriteCanvas.rewriteDocumentContext(currentDoc?.document);

    const requestMessages = [
      new SystemMessage(rewriteCanvas.rewriteCanvasSystemPrompt),
      ...chatHistory,
      new HumanMessage(rewriteCanvasContext),
      new HumanMessage(rewriteCanvasUserPrompt),
    ];

    const responseMessage = await model.invoke(requestMessages, {
      ...config,
      metadata: {
        ...config.metadata,
        ...currentSkill,
        spanId,
      },
    });

    this.engine.logger.log(`responseMessage: ${safeStringifyJSON(responseMessage)}`);

    this.emitEvent({ event: 'log', content: `Rewrite canvas successfully!` }, config);

    return { messages: [responseMessage] };
  };

  // TODO: 将实际的 canvas 的内容发送给模型，拼接为 prompt 处理
  /**
   * Update canvas：更新的形态
   * 1. 口头模糊指明（可能涉及处理多个）：直接口头指明模糊更新的内容（需要模型扫描并给出待操作的模块和对应的 startIndex 和 endIndex），则只需要优化这些内容，其他保持原样，并且发送给前端流式写入
   * 2. 前端明确选中（目前只支持一个）：明确具备选中的 startIndex 和 endIndex（使用的是 tiptap editor），则只需要优化这块内容，其他保持原样，并且发送给前端流式写入
   */
  callEditCanvas = async (state: GraphState, config: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    const { messages = [], query: originalQuery } = state;

    const { currentSkill, spanId, convId, documents, tplConfig } = config.configurable;

    const currentDoc = documents?.find((doc) => doc?.metadata?.isCurrentContext);
    const canvasEditConfig = tplConfig?.canvasEditConfig?.value as CanvasEditConfig;

    if (!currentDoc?.document) {
      throw new DocumentNotFoundError('No current document found for editing');
    }

    this.emitEvent(
      {
        event: 'log',
        content: `Starting canvas edit operation for document: ${currentDoc.document.title}`,
      },
      config,
    );

    // Get selected range from metadata
    const selectedRange = canvasEditConfig.selectedRange as SelectedRange;
    const inPlaceEditType = canvasEditConfig.inPlaceEditType as InPlaceEditType;

    // Extract content context if selection exists
    // const selectedContent = selectedRange
    //   ? editCanvas.extractContentAroundSelection(currentCanvas.canvas.content || '', selectedRange)
    //   : undefined;
    const highlightSelection = canvasEditConfig?.selection as HighlightSelection;

    // Emit intent matcher event
    this.emitEvent(
      {
        event: 'structured_data',
        structuredDataKey: 'intentMatcher',
        content: JSON.stringify({
          type: CanvasIntentType.EditDocument,
          docId: currentDoc.docId,
          convId,
          metadata: {
            selectedRange,
            inPlaceEditType,
            highlightSelection,
          },
        }),
      },
      config,
    );

    const model = this.engine.chatModel({
      temperature: 0.1,
      maxTokens: 4096,
    });

    // Get module based on edit type
    const module: SkillPromptModule = editCanvas.getEditCanvasModule(inPlaceEditType, {
      document: currentDoc.document,
      selectedContent: highlightSelection,
    });

    // Prepare prompts using module functions
    const { requestMessages } = await this.commonPreprocess(state, config, module);

    try {
      const responseMessage = await model.invoke(requestMessages, {
        ...config,
        metadata: {
          ...config.metadata,
          ...currentSkill,
          spanId,
          docId: currentDoc.docId,
          selectedRange,
          inPlaceEditType,
        },
      });

      // Extract edit sections from response, passing selectedContent if it exists
      // const editSections = editCanvas.extractEditSections(responseMessage.content as string, selectedContent);

      // Extract thinking process for logging/debugging
      // const thinking = editCanvas.extractThinking(responseMessage.content as string);

      // Emit edit sections
      // this.emitEvent(
      //   {
      //     event: 'structured_data',
      //     structuredDataKey: 'editSections',
      //     content: JSON.stringify({
      //       sections: editSections,
      //       thinking,
      //       mode: selectedContent ? 'selection' : 'verbal',
      //     }),
      //   },
      //   config,
      // );

      this.emitEvent(
        {
          event: 'log',
          content: 'Canvas edit completed successfully',
        },
        config,
      );

      return {
        messages: [responseMessage],
      };
    } catch (error) {
      this.emitEvent(
        {
          event: 'error',
          content: `Canvas edit failed: ${error.message}`,
        },
        config,
      );
      throw error;
    }
  };

  callCommonQnA = async (state: GraphState, config: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    this.emitEvent({ event: 'log', content: `Start to call common qna...` }, config);
    /**
     * 1. 基于聊天历史，当前意图识别结果，上下文，以及整体优化之后的 query，调用 scheduler 模型，得到一个最优的技能调用序列
     * 2. 基于得到的技能调用序列，调用相应的技能
     */
    const { currentSkill, spanId, resources, documents, convId } = config.configurable;

    const { tplConfig } = config?.configurable || {};

    const currentDoc = documents?.find((doc) => doc?.metadata?.isCurrentContext); // ensure current canvas exists
    const currentResource = resources?.find((resource) => resource?.metadata?.isCurrentContext);
    const canvasEditConfig = (tplConfig?.canvasEditConfig?.value as CanvasEditConfig) || {};

    // Get selected range from metadata
    const selectedRange = canvasEditConfig?.selectedRange as SelectedRange;
    const inPlaceEditType = canvasEditConfig?.inPlaceEditType as InPlaceEditType;

    // Extract content context if selection exists
    // const selectedContent = selectedRange
    //   ? editCanvas.extractContentAroundSelection(currentCanvas.canvas.content || '', selectedRange)
    //   : undefined;
    const highlightSelection = canvasEditConfig?.selection as HighlightSelection; // for qna

    this.emitEvent(
      {
        event: 'structured_data',
        structuredDataKey: 'intentMatcher',
        content: JSON.stringify({
          type: CanvasIntentType.Other,
          docId: currentDoc.docId,
          convId,
          resourceId: currentResource?.resourceId,
          metadata: {
            selectedRange,
            inPlaceEditType,
            highlightSelection,
          },
        }),
      },
      config,
    );

    // common preprocess
    const module = {
      buildSystemPrompt: commonQnA.buildCommonQnASystemPrompt,
      buildContextUserPrompt: commonQnA.buildCommonQnAContextUserPrompt,
      buildUserPrompt: commonQnA.buildCommonQnAUserPrompt,
    };
    const { requestMessages } = await this.commonPreprocess(state, config, module);

    this.emitEvent({ event: 'log', content: `Start to generate an answer...` }, config);

    const model = this.engine.chatModel({ temperature: 0.1 });
    const responseMessage = await model.invoke(requestMessages, {
      ...config,
      metadata: {
        ...config.metadata,
        ...currentSkill,
        spanId,
      },
    });

    this.engine.logger.log(`responseMessage: ${safeStringifyJSON(responseMessage)}`);

    this.emitEvent({ event: 'log', content: `Generated an answer successfully!` }, config);

    return { messages: [responseMessage] };
  };

  callScheduler = async (state: GraphState, config: SkillRunnableConfig): Promise<CanvasIntentType> => {
    try {
      const { query: originalQuery } = state;

      const { chatHistory = [], documents = [], tplConfig } = config.configurable;
      const canvasEditConfig = tplConfig?.canvasEditConfig?.value as CanvasEditConfig;

      this.emitEvent({ event: 'start' }, config);

      const currentDoc = documents?.find((doc) => doc?.metadata?.isCurrentContext);
      const intentMatcherTypeDomain = canvasIntentMatcher.prepareIntentMatcherTypeDomain(
        currentDoc?.document,
        canvasEditConfig,
      );

      let finalIntentType = CanvasIntentType.Other;
      if (intentMatcherTypeDomain.length === 0) {
        finalIntentType = CanvasIntentType.Other;
      } else if (intentMatcherTypeDomain.length === 1) {
        finalIntentType = intentMatcherTypeDomain[0];
      } else if (intentMatcherTypeDomain.length > 1) {
        const model = this.engine.chatModel({ temperature: 0.1 });

        const runnable = model.withStructuredOutput(
          z
            .object({
              intent_type: z
                .enum(intentMatcherTypeDomain as [CanvasIntentType, ...CanvasIntentType[]])
                .describe('The detected intent type based on user query and context'),
              confidence: z.number().min(0).max(1).describe('Confidence score of the intent detection (0-1)'),
              reasoning: z.string().describe('Brief explanation of why this intent was chosen'),
            })
            .describe('Detect the user intent for canvas operations based on the query and context'),
        );

        const result = await runnable.invoke(
          [
            new SystemMessage(canvasIntentMatcher.canvasIntentMatcherPrompt),
            ...chatHistory,
            new HumanMessage(originalQuery),
          ],
          config,
        );

        // Log the intent detection result
        this.engine.logger.log(
          `Intent detection result: ${JSON.stringify({
            type: result.intent_type,
            confidence: result.confidence,
            reasoning: result.reasoning,
          })}`,
        );

        if (canvasIntentMatcher.allIntentMatcherTypeDomain.includes(result.intent_type)) {
          finalIntentType = result.intent_type;
        } else {
          finalIntentType = CanvasIntentType.Other;
        }
      }

      return finalIntentType;
    } catch (err) {
      this.engine.logger.error(`Error detecting intent: ${err.stack}`);
      return CanvasIntentType.Other;
    }
  };

  genRelatedQuestions = async (state: GraphState, config: SkillRunnableConfig) => {
    const { messages = [] } = state;
    const { locale = 'en', selectedSkill } = config.configurable || {};

    const skillConfig = selectedSkill
      ? {
          ...config,
          configurable: {
            ...config.configurable,
            currentSkill: selectedSkill,
          },
        }
      : config;

    const getSystemPrompt = (locale: string) => `## Role
You are an SEO (Search Engine Optimization) expert, skilled at identifying key information from the provided context and proposing three semantically relevant recommended questions based on this information to help users gain a deeper understanding of the content.

## Skills

### Skill 1: Context Identification
- Understand and analyze the given context to determine key information.

### Skill 2: Recommending Questions
- Propose three questions that best fit the context's semantics based on key information, to assist users in better understanding the content.
- Format example:
=====
   - Recommended Question 1: <Question 1>
   - Recommended Question 2: <Question 2>
   - Recommended Question 3: <Question 3>
=====

## Emphasis

- Questions should be **short, concise, and contextual**

Generated question example:

- What are some common English phrases used in button copy for internet products?
- How can I write effective button copy in English for my internet product?
- What are some best practices for writing button copy in English for internet products?

> Up is only for examples, please output related questions in locale: ${locale} language

## Limitations:
- Only propose questions and answers related to the context.
- Strictly adhere to the provided output format.
- Always provide answers that match the user's query.
- Begin the answer directly with the optimized prompt.
  `;

    const model = this.engine.chatModel({ temperature: 0.1 });

    const runnable = model.withStructuredOutput(
      z
        .object({
          recommend_ask_followup_question: z
            .array(z.string())
            .describe(`Generate three recommended follow-up questions in locale: ${locale} language`),
        })
        .describe(
          `Understand and analyze the provided context to identify key information, and based on this ` +
            `key information, formulate three questions that best align with the context's semantics ` +
            `to assist users in gaining a better understanding of the content.`,
        ),
    );

    try {
      const askFollowUpQuestion = await runnable.invoke([
        new SystemMessage(getSystemPrompt(locale)),
        ...messages,
        new HumanMessage(`Please output answer in ${locale} language:`),
      ]);

      const followUps = askFollowUpQuestion?.recommend_ask_followup_question || [];

      this.emitEvent(
        {
          event: 'structured_data',
          content: JSON.stringify(followUps),
          structuredDataKey: 'relatedQuestions',
        },
        skillConfig,
      );
    } catch (error) {
      // Models can sometimes fail to return structured data, so we just log it and do nothing
      this.engine.logger.error(`Error generating related questions: ${error.stack}`);
    } finally {
      this.emitEvent({ event: 'end' }, skillConfig);
    }

    return {};
  };

  toRunnable(): Runnable<any, any, RunnableConfig> {
    const workflow = new StateGraph<GraphState>({
      channels: this.graphState,
    })
      .addNode('generateCanvas', this.callGenerateCanvas)
      .addNode('rewriteCanvas', this.callRewriteCanvas)
      .addNode('editCanvas', this.callEditCanvas)
      .addNode('other', this.callCommonQnA)
      .addNode('relatedQuestions', this.genRelatedQuestions);

    workflow.addConditionalEdges(START, this.callScheduler);
    workflow.addEdge('generateCanvas', 'relatedQuestions');
    workflow.addEdge('rewriteCanvas', 'relatedQuestions');
    workflow.addEdge('editCanvas', 'relatedQuestions');
    workflow.addEdge('other', 'relatedQuestions');
    workflow.addEdge('relatedQuestions', END);

    return workflow.compile();
  }
}
