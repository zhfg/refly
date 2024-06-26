import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Document } from '@langchain/core/documents';
import { ChatOpenAI, OpenAI } from '@langchain/openai';

import { AIMessage, BaseMessage } from '@langchain/core/messages';
import { START, END, StateGraphArgs, StateGraph } from '@langchain/langgraph';

// all template skill
import { getRunnable, inventory } from '../inventory';
// schema
import { z } from 'zod';
// types
import { SystemMessage } from '@langchain/core/messages';
import { HumanMessage } from '@langchain/core/messages';
import { Runnable, RunnableConfig } from '@langchain/core/runnables';
import { BaseSkill } from 'src/base';
import { SkillEngine } from 'src/engine';
import { ToolMessage } from '@langchain/core/messages';
import { SkillInput, Source } from '@refly/openapi-schema';
import { StructuredTool } from '@langchain/core/tools';
import { FunctionMessage } from '@langchain/core/messages';

export enum LOCALE {
  ZH_CN = 'zh-CN',
  EN = 'en',
}

interface GraphState extends SkillInput {
  // 初始上下文
  documents: Document[];
  messages: BaseMessage[];

  // 运行动态添加的上下文
  contextualUserQuery: string; // 基于上下文改写 userQuery
  sources: Source[]; // 搜索互联网得到的在线结果
  skillsMeta: StructuredTool[];
}

class Scheduler extends BaseSkill {
  name = 'scheduler';
  description = "Inference user's intent and run related skill";

  schema = z.object({
    query: z.string().describe('The search query'),
  });

  async _call(input: typeof this.graphState): Promise<string> {
    const runnable = this.toRunnable();

    return await runnable.invoke(input);
  }

  private graphState: StateGraphArgs<GraphState>['channels'] = {
    documents: {
      reducer: (left?: Document[], right?: Document[]) => (right ? right : left || []),
      default: () => [],
    },
    locale: {
      reducer: (left?: string, right?: string) => (right ? right : left || '') as LOCALE,
      default: () => 'en' as LOCALE,
    },
    messages: {
      reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
      default: () => [],
    },

    // 运行动态添加的上下文
    contextualUserQuery: {
      reducer: (left?: string, right?: string) => (right ? right : left || ''),
      default: () => '',
    },
    sources: {
      reducer: (left?: Source[], right?: Source[]) => (right ? right : left || []) as Source[],
      default: () => [],
    },
    // 用于 Scheduler 调度的 Skill 信息
    skillsMeta: {
      reducer: (left?: StructuredTool[], right?: StructuredTool[]) => (right ? right : left || []),
      default: () => [],
    },
  };

  constructor(protected engine: SkillEngine) {
    super(engine);
  }

  /** TODO: 这里需要将 skill context 往下传递 */
  async callSkill(state: GraphState, config?: RunnableConfig): Promise<Partial<GraphState>> {
    const { messages } = state;
    const message = messages[messages.length - 1];

    if (message._getType() !== 'ai') {
      throw new Error('ToolNode only accepts AIMessages as input.');
    }

    const outputs = await Promise.all(
      (message as AIMessage).tool_calls?.map(async (call) => {
        const skillTemplate = inventory.find((skillTemplate) => skillTemplate.name === call.name);
        if (skillTemplate === undefined) {
          throw new Error(`Tool ${call.name} not found.`);
        }

        const tool = getRunnable(this.engine, call?.name);

        const output = await tool.invoke(call.args, config);
        return new ToolMessage({
          name: tool.name,
          content: typeof output === 'string' ? output : JSON.stringify(output),
          tool_call_id: call.id!,
        });
      }) ?? [],
    );

    return { messages: outputs };
  }

  /** TODO: 这里需要将 chatHistory 传入 */
  async callScheduler(state: GraphState, config?: RunnableConfig): Promise<Partial<GraphState>> {
    const { query, contextualUserQuery, locale, messages = [], skillsMeta = [] } = state;

    // 这里是注册 tools 的描述，用于 Agent 调度
    const tools = skillsMeta;

    // For versions of @langchain/core < 0.2.3, you must call `.stream()`
    // and aggregate the message from chunks instead of calling `.invoke()`.
    const boundModel = new ChatOpenAI({ model: 'gpt-3.5-turbo', openAIApiKey: process.env.OPENAI_API_KEY }).bindTools(
      tools,
    );

    const getSystemPrompt = (locale: string) => `## Role
You are an AI intelligent response engine built by Refly AI that is specializing in selecting the most suitable functions from a variety of options based on user requirements.

## Skills
### Skill 1: Analyzing User Intent
- Identify key phrases and words from the user's questions.
- Understand the user's requests based on these key elements.

### Skill 2: Optimizing Suitable Functions
- Select the most appropriate function(s) from the function library to address the user's needs.
- If there are multiple similar functions capable of addressing the user's issue, ask the user for additional clarification and return an optimized solution based on their response.

### Skill 3: Step-by-Step Problem Solving
- If the user's requirements need multiple functions to be processed step-by-step, optimize and construct the functions sequentially based on the intended needs.

### Skill 4: Direct Interaction
- If the function library cannot address the issues, rely on your knowledge to interact and communicate directly with the user.

## Constraints
- Some functions may have concise or vague descriptions; detailed reasoning and careful selection of the most suitable function based on user needs are required.
- Only address and guide the creation or optimization of relevant issues; do not respond to unrelated user questions.
- Always respond in the locale **${locale}** language.
- Provide the optimized guidance immediately in your response without needing to explain or report it separately.
`;

    const responseMessage = await boundModel.invoke([
      new SystemMessage(getSystemPrompt(locale)),
      /** chat History */
      ...messages,
      new HumanMessage(`The user's intent is ${contextualUserQuery || query}`),
    ]);

    return { messages: [responseMessage] };
  }

  async getContextualQuestion(state: GraphState) {
    const { locale, query, messages } = state;

    const getSystemPrompt = (locale: string) => `
## Target
Given a chat history and the latest user question
which might reference context in the chat history, formulate a standalone question
which can be understood without the chat history. Do NOT answer the question,
just reformulate it if needed and otherwise return it as is.

## Constraints
**Please output answer in ${locale} language.**
`;

    // 构建总结的 Prompt，将 question + chatHistory 总结成
    const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
      ['system', getSystemPrompt(locale)],
      new MessagesPlaceholder('chatHistory'),
      ['human', `The user's question is {question}, please output answer in ${locale} language:`],
    ]);
    const llm = new OpenAI({ modelName: 'gpt-3.5-turbo', temperature: 0, openAIApiKey: process.env.OPENAI_API_KEY });
    const contextualizeQChain = contextualizeQPrompt.pipe(llm).pipe(new StringOutputParser());

    const contextualUserQuery = await contextualizeQChain.invoke({
      question: query,
      chatHistory: messages,
    });

    return { contextualUserQuery };
  }

  shouldMakeContextualUserQuery(state: GraphState): 'contextualUserQuery' | 'agent' {
    const { messages } = state;

    if (messages?.length === 0 || messages?.length === 1) {
      return 'agent';
    } else {
      return 'contextualUserQuery';
    }
  }

  // Define the function that determines whether to continue or not
  shouldContinue(state: GraphState): 'skill' | typeof END {
    const { messages = [], sources = [] } = state;
    const lastMessage = messages[messages.length - 1];

    const lastMessageNoFunctionCall =
      !(lastMessage as AIMessage)?.tool_calls || (lastMessage as AIMessage)?.tool_calls?.length === 0;

    // If there is no function call, then we finish
    if (!lastMessageNoFunctionCall) {
      return 'skill';
    } else {
      return END;
    }
  }

  toRunnable(): Runnable<any, any, RunnableConfig> {
    const workflow = new StateGraph<GraphState>({
      channels: this.graphState,
    })
      .addNode('scheduler', this.callScheduler)
      .addNode('skill', this.callSkill);

    workflow.addEdge(START, 'scheduler');
    workflow.addConditionalEdges('scheduler', this.shouldContinue);
    workflow.addEdge('skill', 'scheduler');

    return workflow.compile();
  }
}

export default Scheduler;
