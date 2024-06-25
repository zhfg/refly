import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Document } from '@langchain/core/documents';
import { ChatOpenAI, OpenAI } from '@langchain/openai';

import { AIMessage, BaseMessage } from '@langchain/core/messages';
import { START, END, MessageGraph, StateGraphArgs, StateGraph } from '@langchain/langgraph';

// tools
import { SerperSearch } from '../../tools/serper-online-search';
// types
import { Source } from '@refly/openapi-schema';
import { SystemMessage } from '@langchain/core/messages';
import { HumanMessage } from '@langchain/core/messages';
import { RunnableConfig } from '@langchain/core/runnables';
import { ToolMessage } from '@langchain/core/messages';

export enum LOCALE {
  ZH_CN = 'zh-CN',
  EN = 'en',
}

interface GraphState {
  // 初始上下文
  userQuery: string;
  documents: Document[];
  locale: LOCALE;
  messages: BaseMessage[];

  // 运行动态添加的上下文
  contextualUserQuery: string; // 基于上下文改写 userQuery
  sources: Source[]; // 搜索互联网得到的在线结果
}

const graphState: StateGraphArgs<GraphState>['channels'] = {
  userQuery: {
    reducer: (left?: string, right?: string) => (right ? right : left || ''),
    default: () => '',
  },
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
  contextualUserQuery: {
    reducer: (left?: string, right?: string) => (right ? right : left || ''),
    default: () => '',
  },
  sources: {
    reducer: (left?: Source[], right?: Source[]) => (right ? right : left || []) as Source[],
    default: () => [],
  },
};

export const getContextualQuestion = async (state: GraphState): Promise<Partial<GraphState>> => {
  const { locale, userQuery, messages } = state;

  const getSystemPrompt = (locale: LOCALE) => `
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
    question: userQuery,
    chatHistory: messages,
  });

  return { contextualUserQuery };
};

function shouldMakeContextualUserQuery(state: GraphState): 'contextualUserQuery' | 'agent' {
  const { messages } = state;

  if (messages?.length === 0 || messages?.length === 1) {
    return 'agent';
  } else {
    return 'contextualUserQuery';
  }
}

// Define the function that determines whether to continue or not
function shouldContinue(state: GraphState): 'action' | 'generate' | typeof END {
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
}

// Define a new graph

const tools = [
  new SerperSearch({
    searchOptions: {
      maxResults: 8,
      locale: 'en' as LOCALE,
    },
  }),
];
const boundModel = new ChatOpenAI({ model: 'gpt-3.5-turbo', openAIApiKey: process.env.OPENAI_API_KEY }).bindTools(
  tools,
);

const callAgentModel = async (state: GraphState, config?: RunnableConfig): Promise<Partial<GraphState>> => {
  // For versions of @langchain/core < 0.2.3, you must call `.stream()`
  // and aggregate the message from chunks instead of calling `.invoke()`.

  const { userQuery, contextualUserQuery, locale, messages = [] } = state;
  const lastMessage = messages[messages.length - 1];
  const isToolMessage = (lastMessage as ToolMessage)?._getType() === 'tool';

  if (isToolMessage) {
    const releventDocs = JSON.parse((lastMessage as ToolMessage)?.content as string) || [];
    const sources: Source[] = releventDocs.map((item) => ({
      pageContent: item.snippet,
      score: -1,
      metadata: {
        source: item.url,
        title: item.name,
      },
    }));

    return { sources };
  }

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
      `The user's query is ${contextualUserQuery || userQuery}, please output answer in locale's ${locale} language:`,
    ),
  ]);

  return { messages: [responseMessage] };
};

const generateAnswer = async (state: GraphState, config?: RunnableConfig) => {
  // For versions of @langchain/core < 0.2.3, you must call `.stream()`
  // and aggregate the message from chunks instead of calling `.invoke()`.

  const { userQuery, contextualUserQuery, locale, sources = [] } = state;

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

  const responseMessage = await boundModel.invoke([
    new SystemMessage(getSystemPrompt(contextToCitationText)),
    new HumanMessage(
      `The user's query is ${contextualUserQuery || userQuery}, please output answer in locale's ${locale} language:`,
    ),
  ]);

  return { messages: [responseMessage] };
};

const toolNode = new ToolNode<GraphState>(tools);

const workflow = new StateGraph<GraphState>({
  channels: graphState,
})
  .addNode('agent', callAgentModel)
  .addNode('action', toolNode)
  .addNode('generate', generateAnswer)
  .addNode('getContextualUserQuery', getContextualQuestion);

workflow.addConditionalEdges(START, shouldMakeContextualUserQuery);
workflow.addEdge('getContextualUserQuery', 'agent');
// Conditional agent -> action OR agent -> END
workflow.addConditionalEdges('agent', shouldContinue);
// Always transition `action` -> `agent`
workflow.addEdge('action', 'agent');
workflow.addEdge('generate', END);

// const memory = SqliteSaver.fromConnString(':memory:'); // Here we only save in-memory

// Setting the interrupt means that any time an action is called, the machine will stop
// export const SearchAndAddResource = workflow.compile({ checkpointer: memory, interruptBefore: ['action'] });
export const SearchAndAddResource = workflow.compile();
