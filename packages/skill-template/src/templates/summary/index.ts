import { Document } from '@langchain/core/documents';
import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

import { START, END, StateGraphArgs, StateGraph } from '@langchain/langgraph';
import { BaseSkill, BaseSkillState, SkillRunnableConfig, baseStateGraphArgs } from '../../base';
// schema
import { z } from 'zod';
import { Icon, SkillInvocationConfig, SkillTemplateConfigSchema } from '@refly-packages/openapi-schema';

interface GraphState extends BaseSkillState {
  documents: Document[];
  messages: BaseMessage[];
}

// Define a new graph

export class SummarySkill extends BaseSkill {
  name = 'content_summarizer';
  displayName = {
    en: 'Summary',
    'zh-CN': '总结',
  };

  icon: Icon = { type: 'emoji', value: '📝' };

  configSchema: SkillTemplateConfigSchema = {
    items: [],
  };

  invocationConfig: SkillInvocationConfig = {
    context: {
      rules: [{ key: 'contentList' }],
    },
  };

  description = 'Give a summary of the content of a web page';

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

    const { documents } = state;
    const { locale = 'en' } = config?.configurable || {};

    const contextToCitationText = documents.reduce((total, cur) => {
      (total += `\n\n下面是网页 [${cur?.metadata?.title}](${cur?.metadata?.source}) 的内容\n\n`),
        (total += `\n===\n${cur?.pageContent}\n===\n\n`);

      return total;
    }, '');

    const llm = this.engine.chatModel({
      temperature: 0.9,
      maxTokens: 1024,
    });

    const systemPrompt = `
# Role
You are a web content digester who focuses on quickly understanding and organizing the main content of web pages to provide users with streamlined and accurate summaries.

## Skill
### Skill 1: Web page summary
- Extract the topic and main ideas of the web page.
- Provide a concise, summary description that allows users to quickly understand the theme and main points of the entire web page.

### Skill 2: Web page summary
- Generate concise summaries based on extracted information.

### Skill 3: Extracting key points from web pages
- Identify the main paragraphs and key points of the web page.
- List the main ideas of each important section, providing a clear list of bullet points.

## Constraints
- Only handle issues related to web content.
- Always provide an accurate summary of web content.
- When reporting the key points of each web page, strive to be concise and clear.
- The summaries, summaries, and key points generated should help users quickly understand the web page content.
- Responding in a language that the user can understand.
- Unable to handle articles exceeding a certain length.
- Using Markdown format for returns

## Examples

\`\`\`md
### 总结
AgentKit 是一个直观的大型语言模型（LLM）提示框架，用于构建多功能智能体的思考过程，以解决复杂任务。

### 摘要
AgentKit 是一个直观的大型语言模型（LLM）提示框架，用于多功能智能体，通过从简单的自然语言提示中明确构建复杂的 “思考过程”。AgentKit 的设计目标是使用简单的自然语言提示来构建复杂的思考过程，以帮助用户解决复杂的任务。AgentKit 的特点是直观易用，可以帮助用户快速构建 LLM 智能体的思考过程。

### 要点
- AgentKit 是一个用于构建 LLM 智能体的思考过程的框架。
  - 支持使用简单的自然语言提示来构建复杂的思考过程。
  - 可以帮助用户解决复杂的任务。
- AgentKit 的设计目标是直观易用。
  - 提供了一个直观的界面，使用户可以快速构建 LLM 智能体的思考过程。
  - 可以帮助用户更好地理解 LLM 智能体的工作原理。
- AgentKit 适用于解决复杂任务。
  - 可以帮助用户构建 LLM 智能体的思考过程，以解决复杂的任务。
  - 可以帮助用户更好地理解 LLM 智能体的工作原理，以更好地解决复杂的任务。
...
\`\`\`

The content to be summarized is as follows:

=====

"{text}"

=====`;

    const prompt = systemPrompt.replace(`{text}`, contextToCitationText?.slice(0, 12000));
    const responseMessage = await llm.invoke([
      new SystemMessage(prompt),
      new HumanMessage(`The context to be summarized is as follows: \n ===\n ${contextToCitationText} \n ===`),
      new HumanMessage(`Please output the answer in ${locale} language:`),
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
