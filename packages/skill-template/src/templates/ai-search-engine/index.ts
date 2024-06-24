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
  contextualUserQuery?: string; // 基于上下文改写 userQuery
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
function shouldContinue(state: GraphState): 'action' | typeof END {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];

  // If there is no function call, then we finish
  if (!(lastMessage as AIMessage)?.tool_calls || (lastMessage as AIMessage)?.tool_calls?.length === 0) {
    return END;
  } else {
    return 'action';
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

const callModel = async (state: GraphState, config?: RunnableConfig) => {
  // For versions of @langchain/core < 0.2.3, you must call `.stream()`
  // and aggregate the message from chunks instead of calling `.invoke()`.

  const { userQuery, contextualUserQuery, locale, messages } = state;
  const lastMessage = messages[messages.length - 1];
  const function_call = lastMessage.additional_kwargs.function_call;
  const onlineReleventDocs = JSON.parse(function_call.arguments);

  const contextToCitationText = onlineReleventDocs
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
    new HumanMessage(`The user's query is ${userQuery}, please output answer in locale's ${locale} language:`),
  ]);

  return { messages: [responseMessage] };
};

const toolNode = new ToolNode<GraphState>(tools);

const workflow = new StateGraph<GraphState>({
  channels: graphState,
})
  .addNode('agent', callModel)
  .addNode('action', toolNode)
  .addNode('contextualUserQuery', getContextualQuestion);

workflow.addConditionalEdges(START, shouldMakeContextualUserQuery);
workflow.addEdge('contextualUserQuery', 'agent');
// Conditional agent -> action OR agent -> END
workflow.addConditionalEdges('agent', shouldContinue);
// Always transition `action` -> `agent`
workflow.addEdge('action', 'agent');

// const memory = SqliteSaver.fromConnString(':memory:'); // Here we only save in-memory

// Setting the interrupt means that any time an action is called, the machine will stop
// export const SearchAndAddResource = workflow.compile({ checkpointer: memory, interruptBefore: ['action'] });
export const SearchAndAddResource = workflow.compile();
