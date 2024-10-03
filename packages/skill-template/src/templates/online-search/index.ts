import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

import { AIMessage, BaseMessage } from '@langchain/core/messages';
import { START, END, StateGraphArgs, StateGraph } from '@langchain/langgraph';

// tools
import { SearchResultContext, SerperSearch } from '../../tools/serper-online-search';
// schema
import { z } from 'zod';
// types
import { SystemMessage } from '@langchain/core/messages';
import { HumanMessage } from '@langchain/core/messages';
import { BaseSkill, BaseSkillState, SkillRunnableConfig, baseStateGraphArgs } from '../../base';
import { ToolMessage } from '@langchain/core/messages';
import { Source, SkillInvocationConfig, SkillTemplateConfigSchema, Icon } from '@refly-packages/openapi-schema';

interface GraphState extends BaseSkillState {
  // 初始上下文
  messages: BaseMessage[];

  // 运行动态添加的上下文
  contextualUserQuery: string; // 基于上下文改写 userQuery
  sources: Source[]; // 搜索互联网得到的在线结果
}

export class OnlineSearchSkill extends BaseSkill {
  name = 'online_search';

  displayName = {
    en: 'Online Search',
    'zh-CN': '在线搜索',
  };

  icon: Icon = { type: 'emoji', value: '🌐' };

  configSchema: SkillTemplateConfigSchema = {
    items: [],
  };

  invocationConfig: SkillInvocationConfig = {};

  description =
    'A search engine. Useful for when you need to answer questions about current events. Input should be a search query.';

  schema = z.object({
    query: z.string().describe('The search query'),
  });

  graphState: StateGraphArgs<GraphState>['channels'] = {
    ...baseStateGraphArgs,
    messages: {
      reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
      default: () => [],
    },
    contextualUserQuery: {
      reducer: (left?: string, right?: string) => (right ? right : left || ''),
      default: () => '',
    },
    sources: {
      reducer: (left?: Source[], right?: Source[]) => (right ? right : left || []) as Source[],
      default: () => [],
    },
  };

  callAgentModel = async (state: GraphState, config?: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    const { query, contextualUserQuery, messages = [] } = state;
    const { locale = 'en' } = config?.configurable || {};

    const lastMessage = messages[messages.length - 1];
    const isToolMessage = (lastMessage as ToolMessage)?._getType() === 'tool';

    // 这里是注册 tools 的描述，用于 Agent 调度
    const tools = [new SerperSearch({ searchOptions: { maxResults: 8, locale }, engine: this.engine })];

    // For versions of @langchain/core < 0.2.3, you must call `.stream()`
    // and aggregate the message from chunks instead of calling `.invoke()`.
    const boundModel = this.engine.chatModel().bindTools(tools);

    if (isToolMessage) {
      const releventDocs: SearchResultContext[] = JSON.parse((lastMessage as ToolMessage)?.content as string) || [];
      const sources: Source[] = releventDocs.map((item) => ({
        url: item.url,
        title: item.name,
        pageContent: item.snippet,
      }));
      this.emitEvent(
        {
          event: 'structured_data',
          content: JSON.stringify(sources),
          structuredDataKey: 'sources',
        },
        config,
      );

      return { sources };
    }

    this.emitEvent(
      {
        event: 'log',
        content: `User query: ${contextualUserQuery || query}`,
      },
      config,
    );

    const getSystemPrompt = () => `# Role
  
  You are an exceptional Search Engineer, capable of accurately discerning user needs and leveraging the SerperSearch tool for web content searches. In addition, you have the ability to answer user queries using general knowledge.
  
  ## Skills
  
  ### Skill 1: Needs Analysis
  - Assess and determine the true needs behind user inquiries.
  - Utilize the SerperSearch tool when users request web content search.
  
  ### Skill 2: Utilizing SerperSearch
  - Perform web content searches using the SerperSearch tool.
  - Return content that best matches user needs based on search results.
  
  ### Skill 3: Knowledge-Based Answers
  - Address user queries using general knowledge when web searches are not required. 
  
  ## Constraints
  - Handle only user requests related to searches or general knowledge queries.
  - Must use the SerperSearch tool when the user’s inquiry requires a web search.
  - Ensure accuracy and reliability when providing answers to general knowledge questions.`;

    const responseMessage = await boundModel.invoke([
      new SystemMessage(getSystemPrompt()),
      new HumanMessage(
        `The user's query is ${contextualUserQuery || query}, please output answer in locale's ${locale} language:`,
      ),
    ]);

    return { messages: [responseMessage] };
  };

  getContextualQuestion = async (state: GraphState, config?: SkillRunnableConfig) => {
    const { query, messages } = state;
    const { locale = 'en' } = config?.configurable || {};

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
    const llm = this.engine.chatModel({ temperature: 0 });
    const contextualizeQChain = contextualizeQPrompt.pipe(llm).pipe(new StringOutputParser());

    const contextualUserQuery = await contextualizeQChain.invoke({
      question: query,
      chatHistory: messages,
    });

    return { contextualUserQuery };
  };

  shouldMakeContextualUserQuery = (state: GraphState): 'contextualUserQuery' | 'agent' => {
    const { messages } = state;

    if (messages?.length === 0 || messages?.length === 1) {
      return 'agent';
    } else {
      return 'contextualUserQuery';
    }
  };

  // Define the function that determines whether to continue or not
  shouldContinue = (state: GraphState): 'action' | 'generate' | typeof END => {
    const { messages = [], sources = [] } = state;
    const lastMessage = messages[messages.length - 1];

    // 之前有 AI Messages，也有函数调用，那么就进入 generate
    const hasFunctionCall = messages
      ?.slice(0, messages?.length - 1)
      .some((message) => (message as AIMessage)?.tool_calls && (message as AIMessage)?.tool_calls?.length > 0);
    const lastMessageNoFunctionCall =
      !(lastMessage as AIMessage)?.tool_calls || (lastMessage as AIMessage)?.tool_calls?.length === 0;

    // If there is no function call, then we finish
    if (sources?.length > 0) {
      return 'generate';
    } else if (!hasFunctionCall && !lastMessageNoFunctionCall) {
      return 'action';
    } else {
      return END;
    }
  };

  generateAnswer = async (state: GraphState, config?: SkillRunnableConfig) => {
    const llm = this.engine.chatModel();
    // For versions of @langchain/core < 0.2.3, you must call `.stream()`
    // and aggregate the message from chunks instead of calling `.invoke()`.

    const { query, contextualUserQuery, sources = [] } = state;
    const { locale = 'en', chatHistory = [] } = config?.configurable || {};

    const contextToCitationText = sources
      .map((item, index) => `[[citation:${index + 1}]] ${item?.pageContent}`)
      .join('\n\n');

    const getSystemPrompt = (
      context: string,
    ) => `You are a large language AI assistant built by Refly AI. You are given a user question, and please write **detail** and accurate answer to the question. You will be given a set of related contexts to the question, each starting with a reference number like [[citation:x]], where x is a number. Please use the context and cite the context at the end of each sentence if applicable.
  
  Your answer must be correct, accurate and written by an expert using an unbiased and professional tone. Please limit to 1024 tokens. Do not give any information that is not related to the question, and do not repeat. Say "information is missing on" followed by the related topic, if the given context do not provide sufficient information.
  
  Please cite the contexts with the reference numbers, in the format [citation:x]. If a sentence comes from multiple contexts, please list all applicable citations, like [citation:3][citation:5]. Other than code and specific names and citations, your answer must be written in the same language as the question.
  
  Here are the set of contexts:
  
  ===
  ${context}
  ===
  
  Remember, don't blindly repeat the contexts verbatim. And here is the user question:`;

    const responseMessage = await llm.invoke([
      new SystemMessage(getSystemPrompt(contextToCitationText)),
      ...chatHistory,
      new HumanMessage(
        `The user's query is ${contextualUserQuery || query}, please output answer in locale's ${locale} language:`,
      ),
    ]);

    return { messages: [responseMessage] };
  };

  callToolNode = async (state: GraphState, config?: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    const { messages = [] } = state;
    const { locale = 'en' } = config?.configurable || {};

    // 这里是直接用于执行的 tool，tool as ToolNode 执行
    const tools = [new SerperSearch({ searchOptions: { maxResults: 8, locale }, engine: this.engine })];

    const message = messages[messages.length - 1];

    if (message?._getType() !== 'ai') {
      throw new Error('ToolNode only accepts AIMessages as input.');
    }

    const outputs = await Promise.all(
      (message as AIMessage).tool_calls?.map(async (call) => {
        const tool = tools.find((tool) => tool.name === call.name);
        if (tool === undefined) {
          throw new Error(`Tool ${call.name} not found.`);
        }
        this.emitEvent(
          {
            event: 'log',
            content: `Start calling ${tool.name} with args: ${JSON.stringify(call.args)})}`,
          },
          config,
        );

        const output = await tool.invoke(call.args, config);
        return new ToolMessage({
          name: tool.name,
          content: typeof output === 'string' ? output : JSON.stringify(output),
          tool_call_id: call.id!,
        });
      }) ?? [],
    );

    this.emitEvent(
      {
        event: 'log',
        content: `Finished calling ${outputs.length} tools`,
      },
      config,
    );

    return { messages: outputs };
  };

  toRunnable() {
    const workflow = new StateGraph<GraphState>({
      channels: this.graphState,
    })
      .addNode('agent', this.callAgentModel)
      .addNode('action', this.callToolNode)
      .addNode('generate', this.generateAnswer)
      .addNode('getContextualUserQuery', this.getContextualQuestion);

    workflow.addConditionalEdges(START, this.shouldMakeContextualUserQuery);
    workflow.addEdge('getContextualUserQuery', 'agent');
    // Conditional agent -> action OR agent -> END
    workflow.addConditionalEdges('agent', this.shouldContinue);
    // Always transition `action` -> `agent`
    workflow.addEdge('action', 'agent');
    workflow.addEdge('generate', END);

    return workflow.compile();
  }
}
