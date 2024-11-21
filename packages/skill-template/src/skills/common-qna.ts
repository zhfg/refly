import { START, END, StateGraphArgs, StateGraph } from '@langchain/langgraph';

// schema
import { z } from 'zod';
// types
import { SystemMessage } from '@langchain/core/messages';
import { HumanMessage } from '@langchain/core/messages';
import { Runnable, RunnableConfig } from '@langchain/core/runnables';
import { BaseSkill, BaseSkillState, SkillRunnableConfig, baseStateGraphArgs } from '../base';
import { safeStringifyJSON } from '@refly-packages/utils';
import { Icon, SkillInvocationConfig, SkillTemplateConfigSchema } from '@refly-packages/openapi-schema';
import { createSkillTemplateInventory } from '../inventory';

// types
import { GraphState, IContext } from '../scheduler/types';
// utils
import { prepareContext } from '../scheduler/utils/context';
import { analyzeQueryAndContext, preprocessQuery } from '../scheduler/utils/queryRewrite';
import { truncateMessages } from '../scheduler/utils/truncator';
import { countMessagesTokens, countToken, ModelContextLimitMap, checkHasContext } from '../scheduler/utils/token';
import { buildFinalRequestMessages, SkillPromptModule } from '../scheduler/utils/message';

// prompts
import * as commonQnA from '../scheduler/module/commonQnA';

export class CommonQnA extends BaseSkill {
  name = 'common_qna';

  displayName = {
    en: 'Common Question Answering',
    'zh-CN': '通用问答',
  };

  icon: Icon = { type: 'emoji', value: '🧙‍♂️' };

  configSchema: SkillTemplateConfigSchema = {
    items: [],
  };

  invocationConfig: SkillInvocationConfig = {};

  description = 'Answer common questions';

  schema = z.object({
    query: z.string().optional().describe('The question to be answered'),
  });

  graphState: StateGraphArgs<BaseSkillState>['channels'] = {
    ...baseStateGraphArgs,
  };

  // Default skills to be scheduled (they are actually templates!).
  skills: BaseSkill[] = createSkillTemplateInventory(this.engine);

  isValidSkillName = (name: string) => {
    return this.skills.some((skill) => skill.name === name);
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

  callCommonQnA = async (state: GraphState, config: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    this.emitEvent({ event: 'log', content: `Start to call common qna...` }, config);

    const { currentSkill } = config.configurable;

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
      },
    });

    this.engine.logger.log(`responseMessage: ${safeStringifyJSON(responseMessage)}`);

    this.emitEvent({ event: 'log', content: `Generated an answer successfully!` }, config);

    return { messages: [responseMessage] };
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
    }

    return {};
  };

  toRunnable(): Runnable<any, any, RunnableConfig> {
    const workflow = new StateGraph<BaseSkillState>({
      channels: this.graphState,
    }).addNode('commonQnA', this.callCommonQnA);

    workflow.addEdge(START, 'commonQnA');
    workflow.addEdge('commonQnA', END);

    return workflow.compile();
  }
}
