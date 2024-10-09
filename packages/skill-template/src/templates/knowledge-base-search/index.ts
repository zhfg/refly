import { z } from 'zod';
import { START, END, StateGraphArgs, StateGraph } from '@langchain/langgraph';
import { Runnable, RunnableConfig } from '@langchain/core/runnables';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { BasePromptTemplate, ChatPromptTemplate, MessagesPlaceholder, PromptTemplate } from '@langchain/core/prompts';
import { BaseSkill, BaseSkillState, SkillRunnableConfig, baseStateGraphArgs } from '../../base';
import { ReflySearch } from '../../tools/refly-search';
import {
  SearchResponse,
  Source,
  SkillInvocationConfig,
  SkillTemplateConfigSchema,
  Icon,
  Entity,
  EntityType,
} from '@refly-packages/openapi-schema';
import { StringOutputParser } from '@langchain/core/output_parsers';

interface GraphState extends BaseSkillState {
  messages: BaseMessage[];
  /**
   * Optimized query for semantic retrieval.
   */
  betterQuestion: string;
  /**
   * Retrieved sources from the knowledge base.
   */
  sources: Source[];
}

export class KnowledgeBaseSearch extends BaseSkill {
  name = 'knowledge_base_search';

  displayName = {
    en: 'Knowledge Base Search',
    'zh-CN': '知识库搜索',
  };

  icon: Icon = { type: 'emoji', value: '🔍' };

  configSchema: SkillTemplateConfigSchema = {
    items: [],
  };

  invocationConfig: SkillInvocationConfig = {
    context: {
      rules: [{ key: 'resources' }],
    },
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
    betterQuestion: {
      reducer: (left?: string, right?: string) => (right ? right : left || ''),
      default: () => '',
    },
    sources: {
      reducer: (left?: Source[], right?: Source[]) => (right ? right : left || []) as Source[],
      default: () => [],
    },
  };

  /**
   * Transform the query to produce a better question.
   * @param state - The current state of the agent, including all messages.
   * @param config - The configuration for the runnable.
   * @returns - The updated state with the new message added to the list of messages.
   */
  rewrite = async (state: GraphState, config?: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    const { query } = state;
    const { locale = 'en' } = config?.configurable || {};

    this.emitEvent(
      {
        event: 'log',
        content: `Start rewrite original query ${query} in ${locale} language`,
      },
      config,
    );

    const getSystemPrompt = (query: string) =>
      `Look at the input and try to reason about the underlying semantic intent / meaning. \n 
    Here is the initial query:
    \n ------- \n
    ${query}
    \n ------- \n`;

    const model = this.engine.chatModel({ temperature: 0 });
    const runnable = model.withStructuredOutput(
      z.object({
        betterQuestion: z.string().describe('Optimized query for semantic retrieval'),
      }),
    );
    const { betterQuestion } = await runnable.invoke([
      new SystemMessage(getSystemPrompt(query)),
      new HumanMessage(`Formulate an improved query in ${locale} language:`),
    ]);

    this.emitEvent(
      {
        event: 'log',
        content: `Rewrite query to ${betterQuestion}`,
      },
      config,
    );

    return { betterQuestion };
  };

  /**
   * Retrieve relevant sources from the knowledge base.
   * @param state - The current state of the agent, including all messages.
   * @param config - The configuration for the runnable.
   * @returns - The updated state with the new message added to the list of messages.
   */
  retrieve = async (state: GraphState, config: SkillRunnableConfig) => {
    const { betterQuestion } = state;
    const { user } = config;

    if (!betterQuestion) {
      throw new Error('betterQuestion is empty!');
    }

    this.emitEvent(
      {
        event: 'log',
        content: `Start retrieving with query: ${betterQuestion}`,
      },
      config,
    );

    const { resources, collections } = config?.configurable || {};
    const entities: Entity[] = [
      ...(resources?.map((resource) => ({
        entityType: 'resource' as EntityType,
        entityId: resource.resourceId,
      })) ?? []),
      ...(collections?.map((collection) => ({
        entityType: 'collection' as EntityType,
        entityId: collection.collectionId,
      })) ?? []),
    ];

    const tool = new ReflySearch({ engine: this.engine, user, domains: ['resource'], mode: 'vector', entities });
    const output = await tool.invoke(betterQuestion, config);
    const searchResp = JSON.parse(output) as SearchResponse;

    if (!searchResp.success || searchResp.errMsg) {
      throw new Error(`Search failed: ${searchResp.errMsg}`);
    }

    const sources: Source[] = searchResp.data?.map((result) => ({
      url: result.metadata?.resourceMeta?.url,
      title: result.title,
      pageContent: result.content.join('\n'),
      metadata: {
        resourceId: result.id,
        resourceName: result.title,
        collectionId: result.metadata?.collectionId,
      },
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
  };

  /**
   * Generate answer
   * @param state - The current state of the agent, including all messages.
   * @param config - The configuration for the runnable.
   * @returns The updated state with the new message added to the list of messages.
   */
  generate = async (state: GraphState, config?: SkillRunnableConfig): Promise<Partial<GraphState>> => {
    const { sources, betterQuestion } = state;
    const { locale = 'en', chatHistory = [] } = config?.configurable || {};

    const contextToCitationText = sources
      .map((item, index) => `[[citation:${index + 1}]] ${item?.pageContent}`)
      .join('\n\n');

    const systemPrompt = `# Character
You are a skilled assistant proficient in answering diverse questions. Your core competence lies in using a variety of retrieved context to deliver the most accurate answers.

## Skills
- Understand and analyze the user's question
- Evaluate and select appropriate context based on the user's question
- Use the selected context to formulate a comprehensive answer
- If the answer is unknown, graciously admit it

## Constraints
- Must address queries pertaining to question-answering tasks only
- Aim to deliver thorough answers rooted in relevant context
- Should only use the language used in the user's question
- Use honesty and transparency in admitting lack of knowledge, if necessary
- Do not offer guesses or assumptions as answers
- Cite the contexts with the reference numbers, in the format [[citation:x]]. If a sentence comes from multiple contexts, please list all applicable citations, like [[citation:3]][[citation:5]]
- Other than code and specific names and citations, your answer must be written in the same language as the question

Here are the set of contexts:

===
{context}
===

Remember, don't blindly repeat the contexts verbatim.`;

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      new MessagesPlaceholder('chatHistory'),
      [
        'human',
        `The user's question is: {question}
Please output answer in ${locale} language:`,
      ],
    ]);

    const llm = this.engine.chatModel({ temperature: 0 });

    const customDocumentPrompt = new PromptTemplate({
      template: '[[citation:{index}]] {page_content}',
      inputVariables: ['index', 'page_content'],
    });
    const ragChain = await createStuffDocumentsChain({
      llm,
      prompt,
      documentPrompt: customDocumentPrompt,
      outputParser: new StringOutputParser(),
    });

    const retrievedDocs = sources.map((res, index) => ({
      metadata: {
        source: res.url,
        title: res.title,
        collectionId: res.metadata.collectionId,
        resourceId: res.metadata.resourceId,
        index: index + 1, // Add index for citation
      },
      pageContent: res.pageContent,
    }));

    const message = await ragChain.invoke({
      question: betterQuestion,
      chatHistory,
      context: retrievedDocs,
    });

    return { messages: [new AIMessage(message)] };
  };

  toRunnable(): Runnable<any, any, RunnableConfig> {
    // Define a new graph
    const workflow = new StateGraph<GraphState>({
      channels: this.graphState,
    })
      .addNode('rewrite', this.rewrite)
      .addNode('retrieve', this.retrieve)
      .addNode('generate', this.generate)
      .addEdge(START, 'rewrite')
      .addEdge('rewrite', 'retrieve')
      .addEdge('retrieve', 'generate')
      .addEdge('generate', END);

    return workflow.compile();
  }
}
