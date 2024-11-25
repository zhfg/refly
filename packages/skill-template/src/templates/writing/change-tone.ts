import { Document } from '@langchain/core/documents';
import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

import { START, END, StateGraphArgs, StateGraph } from '@langchain/langgraph';
import { BaseSkill, BaseSkillState, SkillRunnableConfig, baseStateGraphArgs } from '../../base';
// schema
import { z } from 'zod';
import { Icon, SkillInvocationConfig, SkillTemplateConfigDefinition } from '@refly-packages/openapi-schema';

interface GraphState extends BaseSkillState {
  documents: Document[];
  messages: BaseMessage[];
}

// Define a new graph

export class ChangeToneSkill extends BaseSkill {
  name = 'change_tone';
  displayName = {
    en: 'Change Tone',
    'zh-CN': '修改语气',
  };

  icon: Icon = { type: 'emoji', value: '🔈' };

  configSchema: SkillTemplateConfigDefinition = {
    items: [
      {
        key: 'targetTone',
        inputMode: 'select',
        labelDict: {
          en: 'Target Tone',
          'zh-CN': '目标语气',
        },
        descriptionDict: {
          en: 'The tone to change to',
          'zh-CN': '目标语气',
        },
        required: {
          value: true,
          configScope: ['runtime'],
        },
        defaultValue: 'professional',
        options: [
          {
            value: 'professional',
            labelDict: {
              en: 'Professional',
              'zh-CN': '专业的',
            },
          },
          {
            value: 'casual',
            labelDict: {
              en: 'Casual',
              'zh-CN': '随意的',
            },
          },
          {
            value: 'critical',
            labelDict: {
              en: 'Critical',
              'zh-CN': '批判的',
            },
          },
          {
            value: 'humorous',
            labelDict: {
              en: 'Humorous',
              'zh-CN': '幽默的',
            },
          },
          {
            value: 'direct',
            labelDict: {
              en: 'Direct',
              'zh-CN': '直接的',
            },
          },
          {
            value: 'confident',
            labelDict: {
              en: 'Confident',
              'zh-CN': '自信的',
            },
          },
          {
            value: 'friendly',
            labelDict: {
              en: 'Friendly',
              'zh-CN': '友好的',
            },
          },
        ],
      },
    ],
  };

  invocationConfig: SkillInvocationConfig = {
    context: {
      rules: [
        {
          key: 'contentList',
          limit: 1,
          required: true,
          preferredSelectionKeys: ['canvasCursorSelection'],
        },
      ],
    },
  };

  description = 'Change the tone of the writing';

  schema = z.object({
    query: z.string().describe('The user query'),
  });

  graphState: StateGraphArgs<GraphState>['channels'] = {
    ...baseStateGraphArgs,
    documents: {
      reducer: (left?: Document[], right?: Document[]) => (right ? right : left || []),
      default: () => [],
    },
    messages: {
      reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
      default: () => [],
    },
  };

  async generate(state: GraphState, config?: SkillRunnableConfig) {
    this.engine.logger.log('---GENERATE---');

    const { query } = state;
    const { locale = 'en', contentList = [], chatHistory = [], tplConfig = {} } = config?.configurable || {};

    const llm = this.engine.chatModel({
      temperature: 0.2,
    });

    const systemPrompt = `- Role: Tone Adjustment Specialist
- Background: The user requires the selected content to be modified to convey a specific tone, such as formal, informal, persuasive, or enthusiastic, without altering the fundamental message.
- Profile: You are an expert in adjusting the tone of written content, adept at understanding the nuances of language and the impact of different tones on the reader's perception.
- Skills: You have the ability to analyze the original content, identify the desired tone, and rephrase the content to match that tone effectively.
- Goals: To modify the selected content to reflect the specified tone while preserving the original meaning and intent.
- Constrains: The content must be adjusted to fit the desired tone without changing the core message or introducing any inaccuracies.
- OutputFormat: The content should be output in the original language, with the modified tone clearly evident in the revised text.
- Workflow:
  1. Analyze the given context to understand its current tone and message.
  2. Determine the desired tone as specified by the user.
  3. Identify key phrases and sentences that can be adjusted to reflect the new tone.
  4. Rephrase the content to match the desired tone, ensuring the original meaning is maintained.
  5. Review the modified content to confirm it meets the specified tone and is free of errors.
- Examples:
  - Example 1: Original informal description of a product is adjusted to a formal tone for a business presentation.
  - Example 2: A persuasive argument is fine-tuned to be more compelling and impactful for a sales pitch.
  - Example 3: A technical report is modified to have an enthusiastic tone for a motivational speech.
- Initialization: In the first conversation, please directly output the following: Welcome! I specialize in adjusting the tone of content to meet your specific communication needs. Please provide the content and the desired tone you wish to achieve.

# CONTEXT
Context as following (with three "---" as separator, **only include the content between the separator, not include the separator**):
---
{context}
---

TARGET TONE: {targetTone}
`;

    const contextString =
      contentList.length > 0 ? contentList.map((item) => item?.content).join('\n') : 'No additional context provided.';

    const targetTone = tplConfig?.targetTone?.value as string;
    const prompt = systemPrompt.replace('{context}', contextString).replace('{targetTone}', targetTone);

    const responseMessage = await llm.invoke([
      new SystemMessage(prompt),
      new HumanMessage(`The context is provided above, please adjust the tone to the specified tone`),
    ]);

    return { messages: [responseMessage] };
  }

  toRunnable() {
    const workflow = new StateGraph<GraphState>({
      channels: this.graphState,
    })
      .addNode('generate', this.generate.bind(this))
      .addEdge(START, 'generate')
      .addEdge('generate', END);

    return workflow.compile();
  }
}
