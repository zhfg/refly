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
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

// utils
import { processQuery } from '../scheduler/utils/queryProcessor';
import { prepareContext } from '../scheduler/utils/context';

export class CustomPrompt extends BaseSkill {
  name = 'customPrompt';

  icon: Icon = { type: 'emoji', value: '✍️' };

  configSchema: SkillTemplateConfigDefinition = {
    items: [
      {
        key: 'customSystemPrompt',
        inputMode: 'inputTextArea',
        defaultValue: 'You are a helpful AI assistant.',
        labelDict: {
          en: 'Custom System Prompt',
          'zh-CN': '自定义系统提示词',
        },
        descriptionDict: {
          en: 'Define your own system prompt to control the assistant behavior',
          'zh-CN': '定义您自己的系统提示词以控制助手行为',
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
    const { currentSkill, tplConfig } = config.configurable;

    // Set current step
    config.metadata.step = { name: 'customPrompt' };

    // Get custom system prompt from config
    const customSystemPrompt =
      (tplConfig?.customSystemPrompt?.value as string) || 'You are a helpful AI assistant.';

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
    });

    // Prepare context
    const { contextStr } = await prepareContext(
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

    // Create messages with custom system prompt
    const requestMessages = [
      new SystemMessage(customSystemPrompt),
      ...usedChatHistory,
      ...messages,
    ];

    // Add context as a human message if available
    if (contextStr) {
      requestMessages.push(new HumanMessage(`Context information: ${contextStr}`));
    }

    // Add the user query
    requestMessages.push(
      new HumanMessage(
        images?.length
          ? {
              content: [
                { type: 'text', text: query },
                ...(images.map((image) => ({ type: 'image_url', image_url: { url: image } })) ||
                  []),
              ],
            }
          : query,
      ),
    );

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
    }).addNode('customPrompt', this.callCustomPrompt);

    workflow.addEdge(START, 'customPrompt');
    workflow.addEdge('customPrompt', END);

    return workflow.compile();
  }
}
