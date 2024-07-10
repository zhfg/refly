import { ChatOpenAI } from '@langchain/openai';

import { AIMessageChunk, BaseMessage } from '@langchain/core/messages';
import { START, END, StateGraphArgs, StateGraph } from '@langchain/langgraph';

// schema
import { z } from 'zod';
// types
import { SystemMessage } from '@langchain/core/messages';
import { HumanMessage } from '@langchain/core/messages';
import { Runnable, RunnableConfig } from '@langchain/core/runnables';
import { BaseSkill, BaseSkillState, SkillRunnableConfig, SkillRunnableMeta, baseStateGraphArgs } from '../base';
import { ToolMessage } from '@langchain/core/messages';
import { SkillMeta } from '@refly/openapi-schema';
import { ToolCall } from '@langchain/core/dist/messages/tool';
import { randomUUID } from 'node:crypto';
import { createSkillInventory } from '../inventory';

interface GraphState extends BaseSkillState {
  /**
   * Accumulated messages.
   */
  messages: BaseMessage[];
  /**
   * Skill calls to run.
   */
  skillCalls: ToolCall[];
  contextualUserQuery: string; // 基于上下文改写 userQuery
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

  directSkillCall = async (state: GraphState, config?: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    const { selectedSkill, installedSkills } = config?.configurable || {};

    const skillInstance = installedSkills.find((skill) => skill.skillName === selectedSkill.skillName);
    if (!skillInstance) {
      throw new Error(`Skill ${selectedSkill.skillName} not installed.`);
    }

    const skillTemplate = this.skills.find((tool) => tool.name === selectedSkill.skillName);
    if (!skillTemplate) {
      throw new Error(`Skill ${selectedSkill} not found.`);
    }

    const output = await skillTemplate.invoke(
      { query: state.query },
      {
        ...config,
        configurable: {
          ...config?.configurable,
          currentSkill: skillInstance,
        },
      },
    );
    const message = new AIMessageChunk({
      name: skillTemplate.name,
      content: typeof output === 'string' ? output : JSON.stringify(output),
    });

    return { messages: [message] };
  };

  /**
   * Call the first scheduled skill within the state.
   */
  callSkill = async (state: GraphState, config?: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    const { skillCalls } = state;
    if (!skillCalls) {
      this.emitEvent({ event: 'log', content: 'No skill calls to proceed.' }, config);
      return {};
    }

    const { locale = 'en' } = config?.configurable || {};

    // Pick the first skill to call
    const call = state.skillCalls[0];

    // We'll first try to use installed skill instance, if not found then fallback to skill template
    const { installedSkills = [] } = config?.configurable || {};
    const skillInstance = installedSkills.find((skill) => skill.skillName === call.name);
    const skillTemplate = this.skills.find((skill) => skill.name === call.name);
    const currentSkill: SkillMeta = skillInstance ?? {
      skillName: skillTemplate.name,
      skillDisplayName: skillTemplate.displayName[locale],
    };

    // Here we use deepmerge to inject skill metadata into the runnable config.
    const output = await skillTemplate.invoke(call.args, {
      ...config,
      configurable: {
        ...config?.configurable,
        currentSkill,
      },
    });
    const skillMessage = new ToolMessage({
      name: currentSkill.skillName,
      content: typeof output === 'string' ? output : JSON.stringify(output),
      tool_call_id: call.id!,
    });

    // Dequeue the first skill call from the state
    return { messages: [skillMessage], skillCalls: state.skillCalls.slice(1) };
  };

  /** TODO: 这里需要将 chatHistory 传入 */
  callScheduler = async (state: GraphState, config?: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    const { query, contextualUserQuery, messages = [] } = state;

    this.configSnapshot ??= config ?? { configurable: {} };
    this.emitEvent({ event: 'start' }, this.configSnapshot);

    const { locale = 'en', installedSkills, currentSkill, spanId } = this.configSnapshot.configurable;

    let tools = this.skills;
    if (installedSkills) {
      const toolMap = new Map(tools.map((tool) => [tool.name, tool]));
      tools = installedSkills.map((skill) => toolMap.get(skill.skillName)!);
    }
    const boundModel = new ChatOpenAI({ model: 'gpt-3.5-turbo' }).bindTools(tools);

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

## Hint
- Important: Please think step by step to solve the user's problem, In particular, it is necessary to consider the time, place, and purpose of the user's question.
`;

    const responseMessage = await boundModel.invoke(
      [
        new SystemMessage(getSystemPrompt(locale)),
        /** chat History */
        ...messages,
        new HumanMessage(`The user's intent is ${contextualUserQuery || query}`),
      ],
      {
        ...this.configSnapshot,
        metadata: {
          ...this.configSnapshot.metadata,
          ...currentSkill,
          spanId,
        },
      },
    );
    const { tool_calls: skillCalls } = responseMessage;

    if (skillCalls.length > 0) {
      this.emitEvent(
        {
          event: 'log',
          content: `Decide to call skills: ${skillCalls.map((call) => call.name).join(', ')}`,
        },
        this.configSnapshot,
      );
    }

    this.emitEvent({ event: 'end' }, this.configSnapshot);

    // Regenerate new spanId for the next scheduler call.
    this.configSnapshot.configurable.spanId = randomUUID();

    return { messages: [responseMessage], skillCalls };
  };

  shouldDirectCallSkill = (state: GraphState, config?: SkillRunnableConfig): 'direct' | 'scheduler' => {
    const { selectedSkill } = config?.configurable || {};
    if (!selectedSkill) {
      return 'scheduler';
    }

    if (!this.isValidSkillName(selectedSkill.skillName)) {
      this.emitEvent(
        {
          event: 'log',
          content: `Selected skill ${selectedSkill.skillName} not found. Fallback to scheduler.`,
        },
        config,
      );
      return 'scheduler';
    }

    return 'direct';
  };

  shouldCallSkill = (state: GraphState): 'skill' | typeof END => {
    const { skillCalls = [] } = state;

    // If there is no function call, then we finish
    if (skillCalls.length > 0) {
      return 'skill';
    } else {
      return END;
    }
  };

  onSkillCallFinish(state: GraphState, config?: SkillRunnableConfig): 'scheduler' | 'skill' {
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
      .addNode('direct', this.directSkillCall)
      .addNode('scheduler', this.callScheduler)
      .addNode('skill', this.callSkill);

    workflow.addEdge('direct', END);
    workflow.addConditionalEdges(START, this.shouldDirectCallSkill);
    workflow.addConditionalEdges('scheduler', this.shouldCallSkill);
    workflow.addConditionalEdges('skill', this.onSkillCallFinish);

    return workflow.compile();
  }
}
