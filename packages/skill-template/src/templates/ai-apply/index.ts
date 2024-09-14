import { Document } from '@langchain/core/documents';
import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

import { START, END, StateGraphArgs, StateGraph } from '@langchain/langgraph';
import { BaseSkill, BaseSkillState, SkillRunnableConfig, baseStateGraphArgs } from '../../base';
// schema
import { z } from 'zod';
import { Icon, SkillInvocationConfig, SkillTemplateConfigSchema } from '@refly/openapi-schema';

interface GraphState extends BaseSkillState {
  documents: Document[];
  messages: BaseMessage[];
}

// Define a new graph
export class AIApplySkill extends BaseSkill {
  name = 'ai_apply';
  displayName = {
    en: 'AI Apply',
    'zh-CN': 'AI 应用',
  };

  icon: Icon = { type: 'emoji', value: '📄' };

  configSchema: SkillTemplateConfigSchema = {
    items: [],
  };

  invocationConfig: SkillInvocationConfig = {
    input: {
      rules: [{ key: 'query' }],
    },
    context: {
      rules: [
        {
          key: 'contentList',
          inputMode: 'multiSelect',
          defaultValue: ['noteCursorSelection', 'noteBeforeCursorSelection', 'noteAfterCursorSelection'],
        },
      ],
    },
  };

  description = 'Create the article outline';

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
    const { locale = 'en', contentList = [], resources = [], chatHistory = [] } = config?.configurable || {};

    const llm = this.engine.chatModel({
      temperature: 0.2,
    });

    const systemPrompt = `- 角色：内容优化专家
- 背景：用户提供了一段内容和优化建议，需要您基于这些信息进行内容优化。
- 技能：您擅长分析现有内容，理解优化建议，并结合两者给出改进后的完整内容。
- 目标：提供一个经过优化的、完整的内容版本，既保留原内容的核心信息，又融入优化建议。
- 约束：保持内容的连贯性和逻辑性，确保优化后的内容更加清晰、准确和有效。
- 输出格式：请提供完整的优化后内容，保持原有的语言和格式。

# 原始内容
---
{context}
---

# 优化建议
{query}

# 工作流程
1. 仔细阅读原始内容，理解其主要观点和结构。
2. 分析用户提供的优化建议，明确需要改进的方面。
3. 结合原内容和优化建议，进行以下优化：
   - 改进内容的结构和组织
   - 增强表达的清晰度和准确性
   - 补充或删减相关信息
   - 调整语言风格（如需要）
4. 确保优化后的内容保持原有的核心信息和主题。
5. 提供完整的优化后内容。

## 重要提示
请分析提供的内容语言，确保您的回复使用相同的语言。如果内容是中文，请用中文回复；如果是英文，请用英文回复。对于其他语言，请使用相应的语言回复。

请直接输出优化后的完整内容，无需额外解释。
`;

    let contextString = '';
    if (resources.length > 0) {
      contextString = resources
        .map(
          (item) => `
    ---${item?.resource?.title}---
    ${item?.resource?.content}
    ---
    `,
        )
        .join('\n\n');
    } else if (contentList.length > 0) {
      contextString = contentList.map((item) => item?.content).join('\n\n');
    } else {
      contextString = 'No additional context provided.';
    }

    const prompt = systemPrompt.replace('{context}', contextString).replace('{query}', query);

    const responseMessage = await llm.invoke([
      new SystemMessage(prompt),
      new HumanMessage(`The context is provided above, please apply the ai with give content and modify suggestions`),
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
