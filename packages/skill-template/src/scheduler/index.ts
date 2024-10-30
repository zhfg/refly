import { AIMessageChunk, BaseMessage } from '@langchain/core/messages';
import { START, END, StateGraphArgs, StateGraph } from '@langchain/langgraph';

// schema
import { z } from 'zod';
// types
import { SystemMessage } from '@langchain/core/messages';
import { HumanMessage, ChatMessage } from '@langchain/core/messages';
import { Runnable, RunnableConfig } from '@langchain/core/runnables';
import { BaseSkill, BaseSkillState, SkillRunnableConfig, baseStateGraphArgs } from '../base';
import { ToolMessage } from '@langchain/core/messages';
import { CanvasEditConfig, pick, safeParseJSON, safeStringifyJSON } from '@refly-packages/utils';
import { Icon, SkillInvocationConfig, SkillMeta, SkillTemplateConfigSchema } from '@refly-packages/openapi-schema';
import { ToolCall } from '@langchain/core/dist/messages/tool';
import { randomUUID } from 'node:crypto';
import { createSkillInventory } from '../inventory';
// types
import { GraphState, QueryAnalysis, IContext } from './types';
// utils
import { prepareContext } from './utils/context';
import { buildFinalRequestMessages } from './utils/prompt';
import { analyzeQueryAndContext, preprocessQuery } from './utils/queryRewrite';
import { truncateMessages } from './utils/truncator';
import {
  countContextTokens,
  countMessagesTokens,
  countToken,
  ModelContextLimitMap,
  checkHasContext,
} from './utils/token';
import { ChatMode } from './types';
import { CanvasIntentType } from '@refly-packages/common-types';

// prompts
import * as canvasIntentMatcher from './module/canvasIntentMatcher';
import * as generateCanvas from './module/generateCanvas';
import * as rewriteCanvas from './module/rewriteCanvas';
import * as editCanvas from './module/editCanvas';

// types
import { HighlightSelection, SelectedRange } from './module/editCanvas/types';

import { InPlaceEditType } from '@refly-packages/utils';

export class Scheduler extends BaseSkill {
  name = 'scheduler';

  displayName = {
    en: 'Knowledge Curator',
    'zh-CN': '知识管家',
  };

  icon: Icon = { type: 'emoji', value: '🧙‍♂️' };

  configSchema: SkillTemplateConfigSchema = {
    items: [
      {
        key: 'enableWebSearch',
        inputMode: 'radio',
        labelDict: {
          en: 'Web Search',
          'zh-CN': '联网搜索',
        },
        descriptionDict: {
          en: 'Enable web search',
          'zh-CN': '启用联网搜索',
        },
        defaultValue: true,
      },
      {
        key: 'chatMode',
        inputMode: 'select',
        labelDict: {
          en: 'Chat Mode',
          'zh-CN': '聊天模式',
        },
        descriptionDict: {
          en: 'Select chat mode',
          'zh-CN': '选择聊天模式',
        },
        defaultValue: 'normal',
        options: [
          {
            value: 'normal',
            labelDict: {
              en: 'Normal',
              'zh-CN': '直接提问',
            },
          },
          {
            value: 'noContext',
            labelDict: {
              en: 'No Context',
              'zh-CN': '不带上下文提问',
            },
          },
          {
            value: 'wholeSpace',
            labelDict: {
              en: 'Whole Space',
              'zh-CN': '在整个空间提问',
            },
          },
        ],
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
    skillCalls: {
      reducer: (x: ToolCall[], y: ToolCall[]) => y, // always update with newer value
      default: () => [],
    },
    contextualUserQuery: {
      reducer: (left?: string, right?: string) => (right ? right : left || ''),
      default: () => '',
    },
  };

  // Default skills to be scheduled (they are actually templates!).
  skills: BaseSkill[] = createSkillInventory(this.engine);

  // Scheduler config snapshot, should keep unchanged except for `spanId`.
  configSnapshot?: SkillRunnableConfig;

  isValidSkillName = (name: string) => {
    return this.skills.some((skill) => skill.name === name);
  };

  directCallSkill = async (state: GraphState, config: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    const { selectedSkill, installedSkills } = config.configurable || {};

    const skillInstance = installedSkills.find((skill) => skill.skillId === selectedSkill.skillId);
    if (!skillInstance) {
      throw new Error(`Skill ${selectedSkill.tplName} not installed.`);
    }

    const skillTemplate = this.skills.find((tool) => tool.name === selectedSkill.tplName);
    if (!skillTemplate) {
      throw new Error(`Skill ${selectedSkill} not found.`);
    }

    const skillConfig: SkillRunnableConfig = {
      ...config,
      configurable: {
        ...config.configurable,
        currentSkill: skillInstance,
      },
    };

    this.emitEvent({ event: 'start' }, skillConfig);
    const output = await skillTemplate.invoke({ query: state.query }, skillConfig);

    // We'll send end event in genRelatedQuestions node.
    // So don't send it here.

    const message = new AIMessageChunk({
      name: skillTemplate.name,
      content: typeof output === 'string' ? output : JSON.stringify(output),
    });

    return { messages: [message] };
  };

  genToolMsgSummarization = async (needSummarizedContent: string) => {
    const getSystemPrompt = (
      needSummarizedContent: string,
    ) => `You will be provided with a result generated by a tool. Your task is to summarize the most essential information from these results. The summary should include all key points and be no more than 100 words.

Tool results are provided within triple quotes.
"""
${needSummarizedContent}
"""

Summary requirements:
1. The summary must include all key points;
2. Important: The word limit is **100 words**.

After completing the summary, please provide suggestions for the next decision-making steps.

Example tool results:
"""
- The key is on the table.
- The door lock is broken and needs a technician to repair it.
- The living room light isn't working, possibly due to a faulty bulb.
- Schedule a repair for the door lock and bulb replacement as soon as possible.
"""

Example summary:
"""
The key is on the table. The door lock is broken and requires a technician. The living room bulb is faulty and needs replacement. Schedule the repairs and bulb replacement promptly.
"""

Please generate the summary based on these requirements and offer suggestions for the next steps.
  `;

    const model = this.engine.chatModel({ temperature: 0.1, maxTokens: 100 });

    const runnable = model.withStructuredOutput(
      z
        .object({
          summary: z.string(),
        })
        .describe(`Generate the summary based on these requirements and offer suggestions for the next steps.`),
    );
    const summaryModelRes = await runnable.invoke([new HumanMessage(getSystemPrompt(needSummarizedContent))]);

    return summaryModelRes?.summary || '';
  };

  getToolMsg = async (currentSkill: SkillMeta, query: string, realOutput: { messages: BaseMessage[] }) => {
    let realToolOutputMsg: ToolMessage;

    let toolSuccessMsgTemplate = `The **${currentSkill.tplName}** tool is already completed the task based on given user query: **${query}**.
    ## Tool result
      Tool result are provided within triple quotes.
      """
      {{toolResult}}
      """ 
    ## Canvas
    - The result is **already send to user**. 
    - Please evaluate whether the user's request has been fully satisfied. If further actions are needed, determine the next appropriate tool to call; otherwise, terminate the response.`;
    const toolFailedMsgTemplate = `The **${currentSkill.tplName}** tool call without any content, please check whether need call new tool or stop response`;

    // handle summarize for tool operator
    if (realOutput?.messages?.length > 0) {
      const lastMsg = realOutput.messages[realOutput.messages.length - 1];
      let realToolOutputMsgContent = '';

      if (lastMsg?.content?.length > 0) {
        const summarizedToolMsg = await this.genToolMsgSummarization(
          typeof lastMsg.content === 'string' ? lastMsg.content : JSON.stringify(lastMsg.content),
        );
        realToolOutputMsgContent = toolSuccessMsgTemplate.replace('{{toolResult}}', summarizedToolMsg);
      } else {
        realToolOutputMsgContent = toolFailedMsgTemplate;
      }

      realToolOutputMsg = new ToolMessage({
        name: currentSkill.tplName,
        content: realToolOutputMsgContent,
        tool_call_id: currentSkill?.skillId!,
      });
    } else {
      realToolOutputMsg = new ToolMessage({
        name: currentSkill.tplName,
        content: toolFailedMsgTemplate,
        tool_call_id: currentSkill?.skillId!,
      });
    }

    return realToolOutputMsg;
  };

  /**
   * Call the first scheduled skill within the state.
   */
  callSkill = async (state: GraphState, config: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    const { skillCalls, query, contextualUserQuery } = state;
    if (!skillCalls) {
      this.emitEvent({ event: 'log', content: 'No skill calls to proceed.' }, config);
      return {};
    }

    const { locale = 'en' } = config.configurable || {};

    // Pick the first skill to call
    const call = state.skillCalls[0];

    // We'll first try to use installed skill instance, if not found then fallback to skill template
    const { installedSkills = [] } = config.configurable || {};
    const skillInstance = installedSkills.find((skill) => skill.tplName === call.name);
    const skillTemplate = this.skills.find((skill) => skill.name === call.name);
    const currentSkill: SkillMeta = skillInstance ?? {
      tplName: skillTemplate.name,
      displayName: skillTemplate.displayName[locale],
      icon: skillTemplate.icon,
    };
    const skillConfig: SkillRunnableConfig = {
      ...config,
      configurable: {
        ...config.configurable,
        currentSkill,
        spanId: randomUUID(), // generate new spanId for each managed skill call
      },
    };

    this.emitEvent({ event: 'start' }, skillConfig);

    // Dequeue the first skill call from the state
    let result: Partial<GraphState> = {
      skillCalls: state.skillCalls.slice(1),
    };

    try {
      const output = await skillTemplate.invoke(call.args, skillConfig);
      const realOutput: { messages: BaseMessage[] } = typeof output === 'string' ? safeParseJSON(output) : output;
      const realToolOutputMsg = await this.getToolMsg(
        {
          tplName: currentSkill.tplName,
          skillId: call?.id,
          displayName: currentSkill.displayName,
          icon: currentSkill.icon,
        },
        contextualUserQuery || query,
        realOutput,
      );

      result = { messages: [realToolOutputMsg] };
    } catch (error) {
      this.engine.logger.error(`Error calling skill ${currentSkill.tplName}: ${error.stack}`);
    } finally {
      this.emitEvent({ event: 'end' }, skillConfig);
    }

    return result;
  };

  callGenerateCanvas = async (state: GraphState, config: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    const { messages = [], query: originalQuery } = state;

    // 确保在使用 configSnapshot 之前初始化它
    this.configSnapshot ??= config;

    const { chatHistory = [], currentSkill, spanId } = config.configurable;
    const { user } = config;

    this.emitEvent({ event: 'start' }, this.configSnapshot);
    this.emitEvent({ event: 'log', content: `Start to generate canvas...` }, config);

    const { convId, projectId = '' } = this.configSnapshot.configurable;
    const res = await this.engine.service.createCanvas(user, {
      title: '',
      initialContent: '',
      projectId,
    });

    // send intent matcher event
    this.emitEvent(
      {
        event: 'structured_data',
        structuredDataKey: 'intentMatcher',
        content: JSON.stringify({
          type: CanvasIntentType.GenerateCanvas,
          projectId: res.data?.projectId || projectId,
          canvasId: res.data?.canvasId || '',
          convId,
        }),
      },
      config,
    );

    const model = this.engine.chatModel({ temperature: 0.1 });

    const requestMessages = [
      new SystemMessage(generateCanvas.generateCanvasPrompt),
      ...chatHistory,
      new HumanMessage(originalQuery),
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

    this.emitEvent({ event: 'log', content: `Generated canvas successfully!` }, config);

    return { messages: [responseMessage], skillCalls: [] };
  };

  callRewriteCanvas = async (state: GraphState, config: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    const { messages = [], query: originalQuery } = state;

    // 确保在使用 configSnapshot 之前初始化它
    this.configSnapshot ??= config;

    const { chatHistory = [], currentSkill, spanId, projectId, convId, canvases } = config.configurable;

    this.emitEvent({ event: 'start' }, this.configSnapshot);
    this.emitEvent({ event: 'log', content: `Start to rewrite canvas...` }, config);

    const currentCanvas = canvases?.find((canvas) => canvas?.metadata?.isCurrentContext);

    // send intent matcher event
    this.emitEvent(
      {
        event: 'structured_data',
        structuredDataKey: 'intentMatcher',
        content: JSON.stringify({
          type: CanvasIntentType.RewriteCanvas,
          projectId: projectId,
          canvasId: currentCanvas?.canvasId || '',
          convId,
        }),
      },
      config,
    );

    const model = this.engine.chatModel({ temperature: 0.1 });

    const rewriteCanvasUserPrompt = rewriteCanvas.rewriteCanvasUserPrompt(originalQuery);
    const rewriteCanvasContext = rewriteCanvas.rewriteCanvasContext(currentCanvas?.canvas);

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

    return { messages: [responseMessage], skillCalls: [] };
  };

  // TODO: 将实际的 canvas 的内容发送给模型，拼接为 prompt 处理
  /**
   * Update canvas：更新的形态
   * 1. 口头模糊指明（可能涉及处理多个）：直接口头指明模糊更新的内容（需要模型扫描并给出待操作的模块和对应的 startIndex 和 endIndex），则只需要优化这些内容，其他保持原样，并且发送给前端流式写入
   * 2. 前端明确选中（目前只支持一个）：明确具备选中的 startIndex 和 endIndex（使用的是 tiptap editor），则只需要优化这块内容，其他保持原样，并且发送给前端流式写入
   */
  callEditCanvas = async (state: GraphState, config: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    const { messages = [], query: originalQuery } = state;
    this.configSnapshot ??= config;

    const { chatHistory = [], currentSkill, spanId, projectId, convId, canvases, tplConfig } = config.configurable;

    const currentCanvas = canvases?.find((canvas) => canvas?.metadata?.isCurrentContext);

    const canvasEditConfig = tplConfig?.canvasEditConfig?.value as CanvasEditConfig;

    if (!currentCanvas?.canvas) {
      throw new Error('No current canvas found for editing');
    }

    this.emitEvent({ event: 'start' }, this.configSnapshot);
    this.emitEvent(
      {
        event: 'log',
        content: `Starting canvas edit operation for canvas: ${currentCanvas.canvas.title}`,
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
          type: CanvasIntentType.EditCanvas,
          projectId,
          canvasId: currentCanvas.canvasId,
          convId,
          selectedRange,
          inPlaceEditType,
        }),
      },
      config,
    );

    const model = this.engine.chatModel({
      temperature: 0.1,
      maxTokens: 4096,
    });

    // Prepare prompts with selected content context based on edit type
    const editCanvasUserPrompt = editCanvas.editCanvasUserPrompt(inPlaceEditType, originalQuery, highlightSelection);
    const editCanvasContext = editCanvas.editCanvasContext(inPlaceEditType, currentCanvas.canvas, highlightSelection);

    const requestMessages = [
      new SystemMessage(editCanvas.editCanvasSystemPrompt(inPlaceEditType)),
      ...chatHistory,
      new HumanMessage(editCanvasContext),
      new HumanMessage(editCanvasUserPrompt),
    ];

    try {
      const responseMessage = await model.invoke(requestMessages, {
        ...config,
        metadata: {
          ...config.metadata,
          ...currentSkill,
          spanId,
          canvasId: currentCanvas.canvasId,
          projectId,
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
        skillCalls: [],
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

  callCanvasIntentMatcher = async (state: GraphState, config: SkillRunnableConfig): Promise<CanvasIntentType> => {
    const { query: originalQuery } = state;

    this.configSnapshot ??= config;

    const { chatHistory = [], projectId, canvases = [] } = config.configurable;

    this.emitEvent({ event: 'start' }, this.configSnapshot);

    const currentCanvas = canvases?.find((canvas) => canvas?.metadata?.isCurrentContext);
    const intentMatcherTypeDomain = canvasIntentMatcher.prepareIntentMatcherTypeDomain(currentCanvas, projectId);

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

    try {
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

      // Emit the structured data event
      this.emitEvent(
        {
          event: 'structured_data',
          content: JSON.stringify({
            type: result.intent_type,
            confidence: result.confidence,
            reasoning: result.reasoning,
          }),
          structuredDataKey: 'intentMatcher',
        },
        config,
      );

      return result.intent_type;
    } catch (error) {
      // Log error and fallback to default intent
      this.engine.logger.error(`Error detecting intent: ${error.stack}`);
      return CanvasIntentType.Other;
    }
  };

  callScheduler = async (state: GraphState, config: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    /**
     * 1. 基于聊天历史，当前意图识别结果，上下文，以及整体优化之后的 query，调用 scheduler 模型，得到一个最优的技能调用序列
     * 2. 基于得到的技能调用序列，调用相应的技能
     */

    this.configSnapshot ??= config;
    this.emitEvent({ event: 'start' }, this.configSnapshot);
    this.emitEvent({ event: 'log', content: `Start to call scheduler...` }, this.configSnapshot);

    const { messages = [], query: originalQuery } = state;
    const {
      locale = 'en',
      chatHistory = [],
      installedSkills,
      currentSkill,
      spanId,
      modelName,
      resources,
      canvases,
      contentList,
      projects,
    } = this.configSnapshot.configurable;

    const { tplConfig } = config?.configurable || {};
    const chatMode = tplConfig?.chatMode?.value as ChatMode;
    const enableWebSearch = tplConfig?.enableWebSearch?.value as boolean;

    this.engine.logger.log(`config: ${safeStringifyJSON(this.configSnapshot.configurable)}`);

    let optimizedQuery = '';
    let mentionedContext: IContext;
    let context: string = '';

    // preprocess query, ensure query is not too long
    const query = preprocessQuery(originalQuery, {
      configSnapshot: this.configSnapshot,
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
      canvases,
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

    const needRewriteQuery = chatMode !== ChatMode.NO_CONTEXT_CHAT && (hasContext || chatHistoryTokens > 0);
    const needPrepareContext =
      (chatMode !== ChatMode.NO_CONTEXT_CHAT && hasContext && remainingTokens > 0) ||
      enableWebSearch ||
      chatMode === ChatMode.WHOLE_SPACE_SEARCH;
    this.engine.logger.log(`needRewriteQuery: ${needRewriteQuery}, needPrepareContext: ${needPrepareContext}`);

    if (needRewriteQuery) {
      const analyedRes = await analyzeQueryAndContext(query, {
        configSnapshot: this.configSnapshot,
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
          configSnapshot: this.configSnapshot,
          ctxThis: this,
          state: state,
          tplConfig,
        },
      );
    }

    this.engine.logger.log(`context: ${safeStringifyJSON(context)}`);

    this.emitEvent({ event: 'log', content: `Start to generate an answer...` }, this.configSnapshot);
    const model = this.engine.chatModel({ temperature: 0.1 });

    const requestMessages = buildFinalRequestMessages({
      locale,
      chatHistory: usedChatHistory,
      messages,
      needPrepareContext,
      context,
      originalQuery: query,
      rewrittenQuery: optimizedQuery,
    });

    this.engine.logger.log(`requestMessages: ${safeStringifyJSON(requestMessages)}`);

    const responseMessage = await model.invoke(requestMessages, {
      ...this.configSnapshot,
      metadata: {
        ...this.configSnapshot.metadata,
        ...currentSkill,
        spanId,
      },
    });

    this.engine.logger.log(`responseMessage: ${safeStringifyJSON(responseMessage)}`);

    this.emitEvent({ event: 'log', content: `Generated an answer successfully!` }, this.configSnapshot);
    this.emitEvent({ event: 'end' }, this.configSnapshot);

    return { messages: [responseMessage], skillCalls: [] };
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
      : this.configSnapshot;

    const getSystemPrompt = (locale: string) => `## Role
You are an SEO (Search Engine Optimization) expert, skilled at identifying key information from the provided context and proposing three semantically relevant recommended questions based on this information to help users gain a deeper understanding of the content.

## Skills

### Skill 1: Context Identification
- Understand and analyze the given context to determine key information.

### Skill 2: Recommending Questions
- Propose three questions that best fit the context's semantics based on key information, to assist users in better understanding the content.
- Format example:
=====
   - ❓ Recommended Question 1: <Question 1>
   - ❓ Recommended Question 2: <Question 2>
   - ❓ Recommended Question 3: <Question 3>
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

  shouldDirectCallSkill = (state: GraphState, config: SkillRunnableConfig): 'direct' | 'scheduler' => {
    const { selectedSkill, installedSkills = [] } = config.configurable || {};

    if (!selectedSkill) {
      return 'scheduler';
    }

    if (!this.isValidSkillName(selectedSkill.tplName)) {
      this.emitEvent(
        {
          event: 'log',
          content: `Selected skill ${selectedSkill.tplName} not found. Fallback to scheduler.`,
        },
        config,
      );
      return 'scheduler';
    }

    return 'direct';
  };

  shouldCallSkill = (state: GraphState, config: SkillRunnableConfig): 'skill' | 'relatedQuestions' | typeof END => {
    // const { skillCalls = [] } = state;
    const { convId } = this.configSnapshot?.configurable ?? config.configurable;

    // if (skillCalls.length > 0) {
    //   return 'skill';
    // }

    // If there is no skill call, then jump to relatedQuestions node
    return convId ? 'relatedQuestions' : END;
  };

  onDirectSkillCallFinish = (state: GraphState, config: SkillRunnableConfig): 'relatedQuestions' | typeof END => {
    const { convId } = config.configurable || {};

    // Only generate related questions in a conversation
    return convId ? 'relatedQuestions' : END;
  };

  onSkillCallFinish(state: GraphState, config: SkillRunnableConfig): 'scheduler' | 'skill' {
    const { skillCalls } = state;

    // Still have skill calls to run
    if (skillCalls.length > 0) {
      return 'skill';
    }

    // All skill calls are finished, so we can return to the scheduler
    return 'scheduler';
  }

  toRunnable(): Runnable<any, any, RunnableConfig> {
    const workflow = new StateGraph<GraphState>({
      channels: this.graphState,
    })
      // .addNode('direct', this.directCallSkill)
      // .addNode('scheduler', this.callScheduler)
      // .addNode('generateCanvas', this.callGenerateCanvas)
      // .addNode('rewriteCanvas', this.callRewriteCanvas)
      .addNode('editCanvas', this.callEditCanvas)
      // .addNode('other', this.callScheduler)
      .addNode('relatedQuestions', this.genRelatedQuestions);

    // workflow.addConditionalEdges(START, this.shouldDirectCallSkill);
    // workflow.addConditionalEdges('direct', this.onDirectSkillCallFinish);
    // workflow.addConditionalEdges('scheduler', this.shouldCallSkill);
    // workflow.addConditionalEdges(START, this.callCanvasIntentMatcher);
    workflow.addEdge(START, 'editCanvas');
    // workflow.addEdge('generateCanvas', 'relatedQuestions');
    // workflow.addEdge('rewriteCanvas', 'relatedQuestions');
    workflow.addEdge('editCanvas', 'relatedQuestions');
    // workflow.addEdge('other', 'relatedQuestions');
    workflow.addEdge('relatedQuestions', END);

    return workflow.compile();
  }
}
