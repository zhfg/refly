import { AIMessageChunk, BaseMessage } from '@langchain/core/messages';
import { START, END, StateGraphArgs, StateGraph } from '@langchain/langgraph';

// schema
import { z } from 'zod';
// types
import { SystemMessage } from '@langchain/core/messages';
import { HumanMessage } from '@langchain/core/messages';
import { Runnable, RunnableConfig } from '@langchain/core/runnables';
import { BaseSkill, BaseSkillState, SkillRunnableConfig, baseStateGraphArgs } from '../base';
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
    'zh-CN': 'Refly 知识管家',
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

  directCallSkill = async (state: GraphState, config: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    const { selectedSkill, installedSkills } = config.configurable || {};

    const skillInstance = installedSkills.find((skill) => skill.name === selectedSkill.name);
    if (!skillInstance) {
      throw new Error(`Skill ${selectedSkill.name} not installed.`);
    }

    const skillTemplate = this.skills.find((tool) => tool.name === selectedSkill.name);
    if (!skillTemplate) {
      throw new Error(`Skill ${selectedSkill} not found.`);
    }

    const skillConfig = {
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

  /**
   * Call the first scheduled skill within the state.
   */
  callSkill = async (state: GraphState, config: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    const { skillCalls } = state;
    if (!skillCalls) {
      this.emitEvent({ event: 'log', content: 'No skill calls to proceed.' }, config);
      return {};
    }

    const { locale = 'en' } = config.configurable || {};

    // Pick the first skill to call
    const call = state.skillCalls[0];

    // We'll first try to use installed skill instance, if not found then fallback to skill template
    const { installedSkills = [] } = config.configurable || {};
    const skillInstance = installedSkills.find((skill) => skill.name === call.name);
    const skillTemplate = this.skills.find((skill) => skill.name === call.name);
    const currentSkill: SkillMeta = skillInstance ?? {
      name: skillTemplate.name,
      displayName: skillTemplate.displayName[locale],
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
    const output = await skillTemplate.invoke(call.args, skillConfig);
    this.emitEvent({ event: 'end' }, skillConfig);

    const skillMessage = new ToolMessage({
      name: currentSkill.name,
      content: typeof output === 'string' ? output : JSON.stringify(output),
      tool_call_id: call.id!,
    });

    // Dequeue the first skill call from the state
    return { messages: [skillMessage], skillCalls: state.skillCalls.slice(1) };
  };

  callScheduler = async (state: GraphState, config: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    const { query, contextualUserQuery, messages = [] } = state;

    this.configSnapshot ??= config;
    this.emitEvent({ event: 'start' }, this.configSnapshot);

    const { locale = 'en', chatHistory = [], installedSkills, currentSkill, spanId } = this.configSnapshot.configurable;

    let tools = this.skills;
    if (installedSkills) {
      const toolMap = new Map(tools.map((tool) => [tool.name, tool]));
      tools = installedSkills.map((skill) => toolMap.get(skill.name)!);
    }
    const boundModel = this.engine.chatModel().bindTools(tools);

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

    const responseMessage = await boundModel.invoke(
      [
        new SystemMessage(getSystemPrompt(locale)),
        ...chatHistory,
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
      this.emitEvent({ event: 'end' }, this.configSnapshot);

      // Regenerate new spanId for the next scheduler call.
      this.configSnapshot.configurable.spanId = randomUUID();
    }

    return { messages: [responseMessage], skillCalls };
  };

  genRelatedQuestions = async (state: GraphState, config: SkillRunnableConfig) => {
    const { messages = [] } = state;
    const { locale = 'en', selectedSkill } = config.configurable || {};

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
    const askFollowUpQuestion = await runnable.invoke([
      new SystemMessage(getSystemPrompt(locale)),
      ...messages,
      new HumanMessage(`Please output answer in ${locale} language:`),
    ]);

    const followUps = askFollowUpQuestion?.recommend_ask_followup_question || [];

    const skillConfig = selectedSkill
      ? {
          ...config,
          configurable: {
            ...config.configurable,
            currentSkill: selectedSkill,
          },
        }
      : this.configSnapshot;

    this.emitEvent(
      {
        event: 'structured_data',
        content: JSON.stringify(followUps),
        structuredDataKey: 'relatedQuestions',
        ...selectedSkill,
      },
      skillConfig,
    );
    this.emitEvent({ event: 'end' }, skillConfig);

    return {};
  };

  shouldDirectCallSkill = (state: GraphState, config: SkillRunnableConfig): 'direct' | 'scheduler' => {
    const { selectedSkill } = config.configurable || {};
    if (!selectedSkill) {
      return 'scheduler';
    }

    if (!this.isValidSkillName(selectedSkill.name)) {
      this.emitEvent(
        {
          event: 'log',
          content: `Selected skill ${selectedSkill.name} not found. Fallback to scheduler.`,
        },
        config,
      );
      return 'scheduler';
    }

    return 'direct';
  };

  shouldCallSkill = (state: GraphState): 'skill' | 'relatedQuestions' => {
    const { skillCalls = [] } = state;

    // If there is no skill call, then jump to relatedQuestions node
    return skillCalls.length > 0 ? 'skill' : 'relatedQuestions';
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
      .addNode('direct', this.directCallSkill)
      .addNode('scheduler', this.callScheduler)
      .addNode('skill', this.callSkill)
      .addNode('relatedQuestions', this.genRelatedQuestions);

    workflow.addConditionalEdges(START, this.shouldDirectCallSkill);
    workflow.addEdge('direct', 'relatedQuestions');
    workflow.addConditionalEdges('scheduler', this.shouldCallSkill);
    workflow.addConditionalEdges('skill', this.onSkillCallFinish);
    workflow.addEdge('relatedQuestions', END);

    return workflow.compile();
  }
}
