import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createClient } from 'redis';

import { Document } from '@langchain/core/documents';
import { CheerioWebBaseLoader } from 'langchain/document_loaders/web/cheerio';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { RedisVectorStore } from '@langchain/redis';
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
  private vectorStore: RedisVectorStore;
  private readonly logger = new Logger(LlmService.name);

  async onModuleInit() {
    const client = createClient({
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    });
    await client.connect();

    this.vectorStore = new RedisVectorStore(new OpenAIEmbeddings(), {
      redisClient: client,
      indexName: 'refly_index',
    });
  }

  async parseAndStoreLink(link: Weblink) {
    const loader = new CheerioWebBaseLoader(link.url);

    // customized webpage loading
    const $ = await loader.scrape();
    const text = $(loader.selector).text();
    const title = $('title').text();
    const metadata = { source: loader.webPath, title };
    const doc = new Document({ pageContent: text, metadata });

    this.logger.log(`link loaded from ${link.url}`);

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splits = await textSplitter.splitDocuments([doc]);
    this.logger.log(`text splitting complete for ${link.url}`);

    await this.vectorStore.addDocuments(splits);
    this.logger.log(`vector stored for ${link.url}`);
  }

  async retrieveRelevantDocs(query: string) {
    // Retrieve and generate using the relevant snippets of the blog.
    const retriever = this.vectorStore.asRetriever();
    return retriever.getRelevantDocuments(query);
  }

  async chat(query: string, chatHistory: LCChatMessage[]) {
    this.logger.log(`activated with query: ${query}, history: ${chatHistory}`);

    // Retrieve and generate using the relevant snippets of the blog.
    const retriever = this.vectorStore.asRetriever();

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
    const retrievedDocs = await retriever.getRelevantDocuments(
      questionWithContext,
    );

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
