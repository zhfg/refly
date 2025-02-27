import { START, END, StateGraphArgs, StateGraph } from '@langchain/langgraph';
import { z } from 'zod';
import { Runnable, RunnableConfig } from '@langchain/core/runnables';
import { BaseSkill, BaseSkillState, SkillRunnableConfig, baseStateGraphArgs } from '../base';
import {
  Icon,
  SkillInvocationConfig,
  SkillTemplateConfigDefinition,
} from '@refly-packages/openapi-schema';
import { GraphState } from '../scheduler/types';
import { safeStringifyJSON } from '@refly-packages/utils';

// utils
import { processQuery } from '../scheduler/utils/queryProcessor';
import { prepareContext } from '../scheduler/utils/context';
import { buildFinalRequestMessages } from '../scheduler/utils/message';
import { truncateSource } from '../scheduler/utils/truncator';
// prompts
import * as customPrompt from '../scheduler/module/customPrompt/index';

export class CustomPrompt extends BaseSkill {
  name = 'customPrompt';

  icon: Icon = { type: 'emoji', value: '✍️' };

  configSchema: SkillTemplateConfigDefinition = {
    items: [
      {
        key: 'customSystemPrompt',
        inputMode: 'inputTextArea',
        defaultValue: '',
        labelDict: {
          en: 'Custom System Prompt',
          'zh-CN': '自定义系统提示词',
        },
        descriptionDict: {
          en: 'Define your own system prompt to control the assistant behavior',
          'zh-CN': '定义您自己的系统提示词以控制助手行为',
        },
      },
      {
        key: 'temperature',
        inputMode: 'inputNumber',
        defaultValue: 0.1,
        labelDict: {
          en: 'Temperature',
          'zh-CN': 'Temperature',
        },
        descriptionDict: {
          en: 'Controls randomness in the output (0.0-1.0)',
          'zh-CN': '控制输出的随机性 (0.0-1.0)',
        },
        inputProps: {
          min: 0,
          max: 1,
          step: 0.1,
          precision: 2,
        },
      },
      {
        key: 'topP',
        inputMode: 'inputNumber',
        defaultValue: 1,
        labelDict: {
          en: 'Top P',
          'zh-CN': 'Top P',
        },
        descriptionDict: {
          en: 'Controls diversity via nucleus sampling (0.0-1.0)',
          'zh-CN': '通过核采样控制多样性 (0.0-1.0)',
        },
        inputProps: {
          min: 0,
          max: 1,
          step: 0.1,
          precision: 2,
        },
      },
      {
        key: 'maxTokens',
        inputMode: 'inputNumber',
        defaultValue: 2000,
        labelDict: {
          en: 'Max Output Tokens',
          'zh-CN': '最大输出令牌数',
        },
        descriptionDict: {
          en: 'Maximum number of tokens to generate',
          'zh-CN': '生成的最大令牌数',
        },
        inputProps: {
          min: 1,
          step: 1,
          precision: 0,
        },
      },
    ],
  };

  invocationConfig: SkillInvocationConfig = {};

  description = 'Use a custom system prompt to control assistant behavior';

  schema = z.object({
    query: z.string().optional().describe('The user query'),
    images: z.array(z.string()).optional().describe('The images to be read by the skill'),
  });

  graphState: StateGraphArgs<BaseSkillState>['channels'] = {
    ...baseStateGraphArgs,
  };

  callCustomPrompt = async (
    state: GraphState,
    config: SkillRunnableConfig,
  ): Promise<Partial<GraphState>> => {
    const { messages = [], images = [] } = state;
    const { currentSkill, tplConfig, locale = 'en' } = config.configurable;

    // Set current step
    config.metadata.step = { name: 'customPrompt' };

    // Get custom system prompt from config
    let customSystemPrompt = (tplConfig?.customSystemPrompt?.value as string) || '';

    // If customSystemPrompt is empty, look for it in chat history
    if (!customSystemPrompt && config.configurable.chatHistory?.length > 0) {
      // Iterate through chat history in reverse order (most recent first)
      for (let i = config.configurable.chatHistory.length - 1; i >= 0; i--) {
        const message = config.configurable.chatHistory[i];
        // Check if message has skillMeta and tplConfig with customSystemPrompt
        const skillMeta = message.additional_kwargs?.skillMeta as { name?: string } | undefined;
        const messageTplConfig = message.additional_kwargs?.tplConfig as
          | Record<string, any>
          | undefined;

        if (skillMeta?.name === 'customPrompt' && messageTplConfig?.customSystemPrompt?.value) {
          customSystemPrompt = messageTplConfig.customSystemPrompt.value as string;
          this.engine.logger.log('Found customSystemPrompt in chat history');
          break;
        }
      }
    }

    // Use shared query processor
    const {
      optimizedQuery,
      query,
      usedChatHistory,
      remainingTokens,
      mentionedContext,
      rewrittenQueries,
    } = await processQuery({
      config,
      ctxThis: this,
      state,
      shouldSkipAnalysis: true,
    });

    // Prepare context
    const { contextStr, sources } = await prepareContext(
      {
        query: optimizedQuery,
        mentionedContext,
        maxTokens: remainingTokens,
        enableMentionedContext: true,
        rewrittenQueries,
      },
      {
        config,
        ctxThis: this,
        state,
        tplConfig: config.configurable.tplConfig,
      },
    );

    this.engine.logger.log('Prepared context successfully!');

    // Handle sources if available
    if (sources?.length > 0) {
      // Split sources into smaller chunks based on size and emit them separately
      const truncatedSources = truncateSource(sources);
      await this.emitLargeDataEvent(
        {
          data: truncatedSources,
          buildEventData: (chunk, { isPartial, chunkIndex, totalChunks }) => ({
            structuredData: {
              sources: chunk,
              isPartial,
              chunkIndex,
              totalChunks,
            },
          }),
        },
        config,
      );
    }

    // Build messages for the model using the customPrompt module
    const module = {
      buildSystemPrompt: (locale: string, needPrepareContext: boolean) =>
        customPrompt.buildCustomPromptSystemPrompt(customSystemPrompt, locale, needPrepareContext),
      buildContextUserPrompt: customPrompt.buildCustomPromptContextUserPrompt,
      buildUserPrompt: customPrompt.buildCustomPromptUserPrompt,
    };

    // Build messages using the utility function
    const requestMessages = buildFinalRequestMessages({
      module,
      locale,
      chatHistory: usedChatHistory,
      messages,
      needPrepareContext: true,
      context: contextStr,
      images,
      originalQuery: query,
      optimizedQuery,
      rewrittenQueries,
    });

    // Generate answer using the model
    const model = this.engine.chatModel({
      temperature: Number(tplConfig?.temperature?.value ?? 0.1),
      topP: Number(tplConfig?.topP?.value ?? 1),
      maxTokens: Number(tplConfig?.maxTokens?.value ?? 2000),
    });
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
    }).addNode('customPrompt', this.callCustomPrompt);

    workflow.addEdge(START, 'customPrompt');
    workflow.addEdge('customPrompt', END);

    return workflow.compile();
  }
}
