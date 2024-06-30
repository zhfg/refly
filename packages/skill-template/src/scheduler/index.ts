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
import { BaseSkill, BaseSkillState, SkillRunnableConfig, baseStateGraphArgs } from '../base';
import { ToolMessage } from '@langchain/core/messages';
import { Source } from '@refly/openapi-schema';
import { OnlineSearchSkill } from '../templates/online-search';
import { SummarySkill } from '../templates/summary';

interface GraphState extends BaseSkillState {
  // 初始上下文
  messages: BaseMessage[];

  // 运行动态添加的上下文
  contextualUserQuery: string; // 基于上下文改写 userQuery
  sources: Source[]; // 搜索互联网得到的在线结果
}

export class Scheduler extends BaseSkill {
  name = 'scheduler';

  displayName = {
    en: 'Scheduler',
    'zh-CN': '调度器',
  };

  description = "Inference user's intent and run related skill";

  schema = z.object({
    query: z.string().describe('The search query'),
  });

  graphState: StateGraphArgs<GraphState>['channels'] = {
    ...baseStateGraphArgs,
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
  };

  // Tools to be scheduled.
  tools = [new OnlineSearchSkill(this.engine), new SummarySkill(this.engine)];

  /** TODO: 这里需要将 skill context 往下传递 */
  callSkill = async (state: GraphState, config?: RunnableConfig): Promise<Partial<GraphState>> => {
    const { messages } = state;
    const message = messages[messages.length - 1];

    if (message._getType() !== 'ai') {
      throw new Error('ToolNode only accepts AIMessages as input.');
    }

    const outputs = await Promise.all(
      (message as AIMessage).tool_calls?.map(async (call) => {
        const tool = this.tools.find((tool) => tool.name === call.name);
        if (!tool) {
          throw new Error(`Tool ${call.name} not found.`);
        }

        const output = await tool.invoke(call.args, config);
        return new ToolMessage({
          name: tool.name,
          content: typeof output === 'string' ? output : JSON.stringify(output),
          tool_call_id: call.id!,
        });
      }) ?? [],
    );

    return { messages: outputs };
  };

  /** TODO: 这里需要将 chatHistory 传入 */
  callScheduler = async (state: GraphState, config?: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    const { query, contextualUserQuery, messages = [] } = state;
    const { locale = 'en' } = config?.configurable || {};

    // For versions of @langchain/core < 0.2.3, you must call `.stream()`
    // and aggregate the message from chunks instead of calling `.invoke()`.
    const boundModel = new ChatOpenAI({ model: 'gpt-3.5-turbo', openAIApiKey: process.env.OPENAI_API_KEY }).bindTools(
      this.tools,
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
  };

  // Define the function that determines whether to continue or not
  shouldContinue(state: GraphState): 'skill' | typeof END {
    const { messages = [] } = state;
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
