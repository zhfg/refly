import { Document } from '@langchain/core/documents';
import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

import { START, END, StateGraphArgs, StateGraph } from '@langchain/langgraph';
import { BaseSkill, BaseSkillState, SkillRunnableConfig, baseStateGraphArgs } from '../../base';
// schema
import { z } from 'zod';
import { SkillInvocationConfig, SkillTemplateConfigSchema, DynamicConfigValue } from '@refly/openapi-schema';
// utils
import { languageNameToLocale, localeToLanguageName, zhCNLocale } from '@refly/common-types';

interface GraphState extends BaseSkillState {
  documents: Document[];
  messages: BaseMessage[];
}

// Define a new graph
const zhLocaleDict = languageNameToLocale?.['zh-CN'] || {};
const localeOptionList = Object.values(zhLocaleDict).map((val: keyof typeof zhCNLocale) => ({
  labelDict: {
    en: localeToLanguageName?.['en']?.[val],
    'zh-CN': localeToLanguageName?.['zh-CN']?.[val],
  },
  value: val as string,
}));

// Define a new graph
export class CreateBlogPostSkill extends BaseSkill {
  name = 'create_blog_post';
  displayName = {
    en: 'Create Blog Post',
    'zh-CN': '创建博客文章',
  };

  configSchema: SkillTemplateConfigSchema = {
    items: [
      {
        key: 'targetPlatform',
        inputMode: 'select',
        labelDict: {
          en: 'Target Platform',
          'zh-CN': '目标平台',
        },
        descriptionDict: {
          en: 'The platform to create the blog post for',
          'zh-CN': '目标平台',
        },
        required: {
          value: true,
          configScope: ['runtime'],
        },
        defaultValue: 'medium',
        options: [
          {
            value: 'medium',
            labelDict: {
              en: 'Medium',
              'zh-CN': 'Medium',
            },
          },
          {
            value: 'wordpress',
            labelDict: {
              en: 'WordPress',
              'zh-CN': 'WordPress',
            },
          },
          {
            value: 'substack',
            labelDict: {
              en: 'Substack',
              'zh-CN': 'Substack',
            },
          },
          {
            value: 'wechat',
            labelDict: {
              en: 'WeChat',
              'zh-CN': '微信公众号',
            },
          },
          {
            value: 'zhihu',
            labelDict: {
              en: 'Zhihu',
              'zh-CN': '知乎',
            },
          },
          {
            value: 'toutiao',
            labelDict: {
              en: 'Toutiao',
              'zh-CN': '今日头条',
            },
          },
        ],
      },
      {
        key: 'topic',
        inputMode: 'inputTextArea',
        defaultValue: '',
        labelDict: {
          en: 'Topic',
          'zh-CN': '主题',
        },
        descriptionDict: {
          en: 'The topic of the blog post',
          'zh-CN': '输入你要撰写的博客主题',
        },
        required: {
          value: true,
          configScope: ['runtime'],
        },
      },
      {
        key: 'tone',
        inputMode: 'select',
        labelDict: {
          en: 'Blog Tone',
          'zh-CN': '博客语气',
        },
        descriptionDict: {
          en: 'The tone of the blog post',
          'zh-CN': '博客语气',
        },
        defaultValue: 'professional',
        required: {
          value: true,
          configScope: ['runtime'],
        },
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
      {
        key: 'length',
        inputMode: 'select',
        labelDict: {
          en: 'Article Length',
          'zh-CN': '文章长度',
        },
        defaultValue: 'medium',
        descriptionDict: {
          en: 'The length of the article',
          'zh-CN': '文章长度',
        },
        required: {
          value: true,
          configScope: ['runtime'],
        },
        options: [
          {
            value: 'short',
            labelDict: {
              en: 'Short',
              'zh-CN': '短',
            },
          },
          {
            value: 'medium',
            labelDict: {
              en: 'Medium',
              'zh-CN': '中',
            },
          },
          {
            value: 'long',
            labelDict: {
              en: 'Long',
              'zh-CN': '长',
            },
          },
        ],
      },
      {
        key: 'language',
        inputMode: 'select',
        labelDict: {
          en: 'Language',
          'zh-CN': '语言',
        },
        defaultValue: 'en',
        descriptionDict: {
          en: 'The language of the article',
          'zh-CN': '文章语言',
        },
        required: {
          value: true,
          configScope: ['runtime'],
        },
        options: localeOptionList,
      },
    ],
  };

  invocationConfig: SkillInvocationConfig = {
    context: {
      rules: [
        {
          key: 'contentList',
          limit: 1,
          inputMode: 'multiSelect',
          defaultValue: ['noteBeforeCursorSelection', 'noteCursorSelection', 'noteAfterCursorSelection'],
          descriptionDict: {
            en: 'The context of the article',
            'zh-CN': '参考资料',
          },
        },
      ],
    },
  };

  description = 'Create the blog post';

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

    const { locale = 'en', contentList = [], chatHistory = [], tplConfig } = config?.configurable || {};

    const llm = this.engine.chatModel({
      temperature: 0.2,
    });

    const systemPrompt = `- Role: Blog Article Writing Expert
- Background: The user wishes to craft a blog post tailored to the characteristics of a specific platform, discussing a particular topic or sharing insights, with customizable tone, length, and language.
- Profile: You are an experienced blog post writer capable of creating engaging blog content that aligns with various platforms, tones, and languages.
- Skills: You can conduct thorough research, adapt writing style, and produce well-structured content in multiple languages.
- Goals: To write a blog post based on the given parameters, ensuring it meets the specified requirements.
- Constraints: The blog post should adhere to platform guidelines, maintain the desired tone, and ensure accuracy of information.
- OutputFormat: The blog post should be presented in a format suitable for the specified platform, including appropriate structure and multimedia elements if applicable.
- Workflow:
  1. Understand the user-specified parameters (platform, topic, tone, length, language).
  2. Analyze the given context and topic.
  3. Determine the article's structure and arguments based on the parameters.
  4. Conduct research to gather supporting materials and data.
  5. Draft an outline appropriate for the specified length.
  6. Write the blog post, ensuring it matches the desired tone and language.
  7. Review and edit the post for clarity, engagement, and adherence to parameters.
  8. Add appropriate visual or multimedia content if relevant to the platform.
- Examples:
  - Example 1: Platform: Medium, Topic: "The Future of AI", Tone: Professional, Length: 1500 words, Language: English
  - Example 2: Platform: Instagram, Topic: "Quick Healthy Recipes", Tone: Casual, Length: 500 words, Language: Spanish
- Initialization: Hello! I'm ready to create a blog post tailored to your needs. Please provide the following information:
  1. Target Platform (e.g., Medium, WordPress, LinkedIn)
  2. Theme or Topic
  3. Desired Tone (e.g., Professional, Casual, Humorous)
  4. Approximate Length (in words or paragraphs)
  5. Language
  6. Any additional context or requirements

## CONTEXT
Context as following (with three "---" as separator, **only include the content between the separator, not include the separator**):
---
{context}
---

## REQUIREMENTS

TARGET PLATFORM: {targetPlatform}
TOPIC: {topic}
TONE: {tone}
LENGTH: {length}
LANGUAGE: {language}
`;

    const contextString = contentList.length > 0 ? contentList.join('\n') : 'No additional context provided.';

    const { targetPlatform, topic, tone, length, language } = (tplConfig || {}) as any as {
      targetPlatform: DynamicConfigValue;
      topic: DynamicConfigValue;
      tone: DynamicConfigValue;
      length: DynamicConfigValue;
      language: DynamicConfigValue;
    };
    const prompt = systemPrompt
      .replace('{context}', contextString)
      .replace('{targetPlatform}', targetPlatform?.value as string)
      .replace('{topic}', topic?.value as string)
      .replace('{tone}', tone?.value as string)
      .replace('{length}', length?.value as string)
      .replace('{language}', language?.value as string);

    const responseMessage = await llm.invoke([
      new SystemMessage(prompt),
      new HumanMessage(
        `The context and requirements are provided above, please write a blog post for the target platform`,
      ),
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
