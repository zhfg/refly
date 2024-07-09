import { StringOutputParser } from '@langchain/core/output_parsers';
import { MessageGraph, START, END, StateGraphArgs, StateGraph } from '@langchain/langgraph';
import { Runnable, RunnableConfig } from '@langchain/core/runnables';
import { z } from 'zod';
import { AIMessage, BaseMessage, ToolMessage } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { BaseSkill, BaseSkillState, SkillRunnableConfig, baseStateGraphArgs } from '../../base';
import { ReflySearch } from '@/tools/refly-search';

interface GraphState extends BaseSkillState {
  messages: BaseMessage[];
}

export class RAG extends BaseSkill {
  name = 'rag';

  displayName = {
    en: 'Knowledge Base Search',
    'zh-CN': '知识库搜索',
  };

  description = 'Search for relevant information in the knowledge base and generate answer.';

  schema = z.object({
    query: z.string().describe('The search query'),
  });

  graphState: StateGraphArgs<GraphState>['channels'] = {
    ...baseStateGraphArgs,
    messages: {
      reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
      default: () => [],
    },
  };

  /**
   * Decides whether the agent should retrieve more information or end the process.
   * This function checks the last message in the state for a function call. If a function call is
   * present, the process continues to retrieve information. Otherwise, it ends the process.
   * @param state - The current state of the agent, including all messages.
   * @returns A decision to either "continue" the retrieval process or "end" it.
   */
  shouldRetrieve = (state: GraphState) => {
    console.log('---DECIDE TO RETRIEVE---');

    const { messages } = state;
    const lastMessage = messages[messages.length - 1];
    // If there is no function call then we finish.
    if (!lastMessage.additional_kwargs.function_call) {
      console.log('---DECISION: DO NOT RETRIEVE / DONE---');
      return END;
    }
    console.log('---DECISION: RETRIEVE---');
    return 'retrieve';
  };

  /**
   * Determines whether the Agent should continue based on the relevance of retrieved documents.
   * This function checks if the last message in the conversation is of type FunctionMessage, indicating
   * that document retrieval has been performed. It then evaluates the relevance of these documents to the user's
   * initial question using a predefined model and output parser. If the documents are relevant, the conversation
   * is considered complete. Otherwise, the retrieval process is continued.
   * @param state - The current state of the agent, including all messages.
   * @param config - The configuration for the runnable.
   * @returns The updated state with the new message added to the list of messages.
   */
  gradeDocuments = async (state: GraphState) => {
    console.log('---GET RELEVANCE---');

    const tool = {
      type: 'function' as const,
      function: {
        name: 'give_relevance_score',
        description: 'Give a relevance score to the retrieved documents.',
        parameters: {
          type: 'object',
          properties: {
            binaryScore: {
              type: 'string',
              description: "Relevance score 'yes' or 'no'",
            },
          },
        },
      },
    };

    const prompt = ChatPromptTemplate.fromTemplate(
      `You are a grader assessing relevance of retrieved docs to a user question.
    Here are the retrieved docs:
    \n ------- \n
    {context} 
    \n ------- \n
    Here is the user question: {question}
    If the content of the docs are relevant to the users question, score them as relevant.
    Give a binary score 'yes' or 'no' score to indicate whether the docs are relevant to the question.
    Yes: The docs are relevant to the question.
    No: The docs are not relevant to the question.`,
    );

    const model = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0,
    }).bind({
      tools: [tool],
      tool_choice: tool,
    });

    const chain = prompt.pipe(model);

    const { messages } = state;
    const lastMessage = messages[messages.length - 1];

    const score = await chain.invoke({
      question: state[0].content as string,
      context: lastMessage.content as string,
    });

    return { messages: [score] };
  };

  /**
   * Check the relevance of the previous LLM tool call.
   *
   * @param state - The current state of the agent, including all messages.
   * @returns directive to either "yes" or "no" based on the relevance of the documents.
   */
  checkRelevance = (state: GraphState) => {
    console.log('---CHECK RELEVANCE---');
    const { messages } = state;
    const lastMessage = messages[messages.length - 1];
    const toolCalls = lastMessage.additional_kwargs.tool_calls;
    if (!toolCalls) {
      throw new Error('Last message was not a function message');
    }
    const parsedArgs = JSON.parse(toolCalls[0].function.arguments);

    if (parsedArgs.binaryScore === 'yes') {
      console.log('---DECISION: DOCS RELEVANT---');
      return 'yes';
    }
    console.log('---DECISION: DOCS NOT RELEVANT---');
    return 'no';
  };

  // Nodes

  /**
   * Invokes the agent model to generate a response based on the current state.
   * This function calls the agent model to generate a response to the current conversation state.
   * The response is added to the state's messages.
   * @param state - The current state of the agent, including all messages.
   * @param config - The configuration for the runnable.
   * @returns The updated state with the new message added to the list of messages.
   */
  agent = async (state: GraphState) => {
    console.log('---CALL AGENT---');

    const model = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0,
    }).bindTools([new ReflySearch({ engine: this.engine })]);

    const response = await model.invoke(state.query);
    // We can return just the response because it will be appended to the state.
    return { messages: [response] };
  };

  /**
   * Executes a tool based on the last message's function call.
   * This function is responsible for executing a tool invocation based on the function call
   * specified in the last message. The result from the tool execution is added to the conversation
   * state as a new message.
   * @param state - The current state of the agent, including all messages.
   * @param config - The configuration for the runnable.
   * @returns - The updated state with the new message added to the list of messages.
   */
  retrieve = async (state: GraphState, config?: SkillRunnableConfig) => {
    console.log('---EXECUTE RETRIEVAL---');

    const { messages } = state;

    const lastMessage = messages[messages.length - 1];

    if (lastMessage?._getType() !== 'ai') {
      throw new Error('ToolNode only accepts AIMessages as input.');
    }

    const tool = new ReflySearch({ engine: this.engine });

    const outputs = await Promise.all(
      (lastMessage as AIMessage).tool_calls?.map(async (call) => {
        this.emitEvent({
          event: 'log',
          content: `Start calling ${tool.name} with args: ${JSON.stringify(call.args)})}`,
        });

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

  /**
   * Transform the query to produce a better question.
   * @param state - The current state of the agent, including all messages.
   * @param config - The configuration for the runnable.
   * @returns - The updated state with the new message added to the list of messages.
   */
  rewrite = async (state: GraphState) => {
    console.log('---TRANSFORM QUERY---');
    const question = state[0].content as string;
    const prompt = ChatPromptTemplate.fromTemplate(
      `Look at the input and try to reason about the underlying semantic intent / meaning. \n 
    Here is the initial question:
    \n ------- \n
    {question} 
    \n ------- \n
    Formulate an improved question:`,
    );

    // Grader
    const model = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0,
    });
    const response = await prompt.pipe(model).invoke({ question });
    return { messages: [response] };
  };

  /**
   * Generate answer
   * @param state - The current state of the agent, including all messages.
   * @param config - The configuration for the runnable.
   * @returns The updated state with the new message added to the list of messages.
   */
  generate = async (state: GraphState) => {
    console.log('---GENERATE---');
    const question = state[0].content as string;
    const { messages } = state;
    const sendLastMessage = messages[messages.length - 2];

    const docs = sendLastMessage.content as string;

    const prompt = ChatPromptTemplate.fromTemplate(
      `You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.
Question: {question} 
Context: {context} 
Answer:`,
    );

    const llm = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0,
    });

    const ragChain = prompt.pipe(llm).pipe(new StringOutputParser());

    const response = await ragChain.invoke({
      context: docs,
      question,
    });

    return { messages: [new AIMessage(response)] };
  };

  toRunnable(): Runnable<any, any, RunnableConfig> {
    // Define a new graph
    const workflow = new StateGraph<GraphState>({
      channels: this.graphState,
    })
      // Define the nodes which we'll cycle between.
      .addNode('agent', this.agent)
      .addNode('retrieve', this.retrieve)
      .addNode('gradeDocuments', this.gradeDocuments)
      .addNode('rewrite', this.rewrite)
      .addNode('generate', this.generate);

    // Call agent node to decide to retrieve or not
    workflow.addEdge(START, 'agent');

    // Decide whether to retrieve
    workflow.addConditionalEdges(
      'agent',
      // Assess agent decision
      this.shouldRetrieve,
    );

    workflow.addEdge('retrieve', 'gradeDocuments');

    // Edges taken after the `action` node is called.
    workflow.addConditionalEdges(
      'gradeDocuments',
      // Assess agent decision
      this.checkRelevance,
      {
        // Call tool node
        yes: 'generate',
        no: 'rewrite', // placeholder
      },
    );

    workflow.addEdge('generate', END);
    workflow.addEdge('rewrite', 'agent');

    return workflow.compile();
  }
}
