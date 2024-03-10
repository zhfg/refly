import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import omit from 'lodash.omit';

import { QdrantClient } from '@qdrant/js-client-rest';
import { Document } from '@langchain/core/documents';
import { CheerioWebBaseLoader } from 'langchain/document_loaders/web/cheerio';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';

import { Weblink } from '@prisma/client';
import { qaSystemPrompt, contextualizeQSystemPrompt } from './prompts';
import { LCChatMessage } from './schema';

@Injectable()
export class LlmService implements OnModuleInit {
  private vectorStore: QdrantClient;
  private embeddings: OpenAIEmbeddings;
  private collectionName: string;

  private readonly logger = new Logger(LlmService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.vectorStore = new QdrantClient({
      url: this.configService.get('qdrant.url'),
    });
    this.collectionName = this.configService.get('qdrant.collectionName');
    this.embeddings = new OpenAIEmbeddings();

    await this.ensureCollection();
  }

  /**
   * Method to ensure the existence of a collection in the Qdrant database.
   * If the collection does not exist, it is created.
   * @returns Promise that resolves when the existence of the collection has been ensured.
   */
  async ensureCollection() {
    const response = await this.vectorStore.getCollections();

    const collectionNames = response.collections.map(
      (collection) => collection.name,
    );

    if (!collectionNames.includes(this.collectionName)) {
      await this.vectorStore.createCollection(this.collectionName, {
        vectors: {
          size: (await this.embeddings.embedQuery('test')).length,
          distance: 'Cosine',
        },
      });
    }

    this.logger.log(`qdrant collection initialized: ${this.collectionName}`);
  }

  async parseAndStoreLink(link: Weblink) {
    const loader = new CheerioWebBaseLoader(link.url);

    // customized webpage loading
    const $ = await loader.scrape();
    const text = $(loader.selector).text();
    const title = $('title').text();
    const metadata = { source: loader.webPath, userId: link.userId, title };
    const doc = new Document({ pageContent: text, metadata });

    this.logger.log(`link loaded from ${link.url}`);

    // splitting / chunking
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const documents = await textSplitter.splitDocuments([doc]);
    this.logger.log(`text splitting complete for ${link.url}`);

    // embedding
    const texts = documents.map(({ pageContent }) => pageContent);
    const vectors = await this.embeddings.embedDocuments(texts);

    // load into vector store
    if (vectors.length === 0) {
      return;
    }

    const points = vectors.map((embedding, idx) => ({
      id: uuid(),
      vector: embedding,
      payload: {
        content: documents[idx].pageContent,
        ...documents[idx].metadata,
      },
    }));

    await this.vectorStore.upsert(this.collectionName, {
      wait: true,
      points,
    });
    this.logger.log(`vector stored for ${link.url}`);
  }

  async chat(query: string, chatHistory: LCChatMessage[], filter?: any) {
    this.logger.log(
      `activated with query: ${query}, filter: ${JSON.stringify(filter)}`,
    );

    const llm = new ChatOpenAI({ modelName: 'gpt-3.5-turbo', temperature: 0 });

    // 构建总结的 Prompt，将 question + chatHistory 总结成
    const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
      ['system', contextualizeQSystemPrompt],
      new MessagesPlaceholder('chatHistory'),
      ['human', '{question}'],
    ]);
    const contextualizeQChain = contextualizeQPrompt
      .pipe(llm as any)
      .pipe(new StringOutputParser());
    const questionWithContext =
      chatHistory.length === 0
        ? query
        : await contextualizeQChain.invoke({
            question: query,
            chatHistory,
          });

    const qaPrompt = ChatPromptTemplate.fromMessages([
      ['system', qaSystemPrompt],
      new MessagesPlaceholder('chatHistory'),
      ['human', '{question}'],
    ]);

    // 基于上下文进行问答
    const ragChain = await createStuffDocumentsChain({
      llm,
      prompt: qaPrompt,
      outputParser: new StringOutputParser(),
    });

    const queryEmbedding = await this.embeddings.embedQuery(
      questionWithContext,
    );
    const results = await this.vectorStore.search(this.collectionName, {
      vector: queryEmbedding,
      limit: 5,
      filter,
    });

    const retrievedDocs = results.map((res) => ({
      metadata: omit(res.payload, 'content'),
      pageContent: res.payload.content as string,
      score: res.score, // similarity score
    }));

    return {
      sources: retrievedDocs,
      stream: ragChain.stream({
        question: query,
        context: retrievedDocs,
        chatHistory,
      }),
    };
  }
}
