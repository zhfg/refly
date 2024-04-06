import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import omit from 'lodash.omit';

import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { Document } from '@langchain/core/documents';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { loadSummarizationChain } from 'langchain/chains';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputFunctionsParser } from 'langchain/output_parsers';

import { AigcContent, ChatMessage } from '@prisma/client';
import {
  qa,
  contextualizeQA,
  extractContentMeta,
  summarize,
  summarizeMultipleSource,
  extractSummarizeMeta,
  generateAskFollowupQuestion,
} from '../prompts/index';
import { LLMChatMessage } from './schema';
import { HumanMessage, SystemMessage } from 'langchain/schema';

import { uniqueFunc } from '../utils/unique';
import { ContentMeta } from './dto';
import { categoryList } from '../prompts/utils/category';

@Injectable()
export class LlmService implements OnModuleInit {
  private embeddings: OpenAIEmbeddings;
  private vectorStore: PGVectorStore;
  private llm: ChatOpenAI;

  private readonly logger = new Logger(LlmService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-large',
      batchSize: 512,
      dimensions: this.configService.get('vectorStore.vectorDim'),
      timeout: 5000,
      maxRetries: 3,
    });
    this.vectorStore = await PGVectorStore.initialize(this.embeddings, {
      postgresConnectionOptions: {
        connectionString: process.env.DATABASE_URL,
      },
      tableName: 'content_vectors',
      columns: {
        idColumnName: 'id',
        vectorColumnName: 'vector',
        contentColumnName: 'content',
        metadataColumnName: 'metadata',
      },
    });

    this.llm = new ChatOpenAI({ modelName: 'gpt-3.5-turbo', temperature: 0 });

    this.logger.log('LLM Service ready');
  }

  /**
   * Extract metadata from weblinks.
   * @param doc valid langchain doc representing website content
   */
  async extractContentMeta(doc: Document): Promise<ContentMeta> {
    const { pageContent } = doc;
    this.logger.log('content need to be extract: %s', pageContent);

    const parser = new JsonOutputFunctionsParser();

    const runnable = await this.llm
      .bind({
        functions: [extractContentMeta.extractContentMetaSchema],
        function_call: { name: 'content_category_extractor' },
      })
      .pipe(parser);
    const res = (await runnable.invoke([
      new SystemMessage(extractContentMeta.systemPrompt),
      new HumanMessage(pageContent.slice(0, 12000)),
    ])) as {
      categoryId: string;
      reason: string;
      score: number;
      format: string;
    };
    this.logger.log('extract content meta: %j', res);

    const topic = categoryList?.find((item) => item?.id === res?.categoryId);
    const contentMeta = {
      topics: [
        {
          key: res?.categoryId,
          score: res?.score,
          name: topic?.name,
          reason: res?.reason,
        },
      ],
      contentType: null,
      formats: [{ key: res?.format, score: 0, name: '', reason: '' }],
    };

    this.logger.log('final content meta: %j', contentMeta);

    return contentMeta;
  }

  /**
   * Apply content strategy.
   * @param doc
   * @returns
   */
  async applyStrategy(doc: Document): Promise<Partial<AigcContent>> {
    // direct apply summary and return with structed json format
    const parser = new JsonOutputFunctionsParser();
    const runnable = await this.llm
      .bind({
        functions: [extractSummarizeMeta.extractSummarizeMetaSchema],
        function_call: { name: 'content_meta_extractor' },
      })
      .pipe(parser);
    const summary = (await runnable.invoke([
      new SystemMessage(extractSummarizeMeta.extractSummarizeSystemPrompt),
      new HumanMessage(doc.pageContent?.slice(0, 12000)),
    ])) as {
      title: string;
      abstract: string;
      keywords: string;
    };
    this.logger.log('summarized content: %j', summary);

    return {
      title: summary?.title || '',
      abstract: summary?.abstract.slice(0, 200) || '', // TODO: 概要暂定取前 200 个字符
      content: summary?.abstract || '',
      meta: JSON.stringify({
        keywords: summary?.keywords || '',
      }),
      sources: JSON.stringify([{ medadata: doc?.metadata }]),
    };
  }

  /**
   * summarize multiple weblink
   * @param doc
   * @returns
   */
  async summarizeMultipleWeblink(
    docs: AigcContent[],
  ): Promise<Partial<AigcContent>> {
    // direct apply summary and return with structed json format
    const multipleSourceInputContent = docs.reduce((total, cur) => {
      total += `网页：${cur?.title}
      ===
      网页标题：${cur?.title}
      网页摘要：${cur?.content}
      关键词：${cur?.meta}
      网页链接：${cur?.sources}
      ===
      `;

      return total;
    }, '');

    const parser = new JsonOutputFunctionsParser();
    const runnable = await this.llm
      .bind({
        functions: [
          summarizeMultipleSource.extractSummarizeMultipleSourceMetaSchema,
        ],
        function_call: { name: 'content_meta_extractor' },
      })
      .pipe(parser);
    const contentMeta = (await runnable.invoke([
      new SystemMessage(summarizeMultipleSource.systemPrompt),
      new HumanMessage(multipleSourceInputContent),
    ])) as {
      title: string;
      content: string;
    };

    // TODO: need return topics、all weblinks
    return {
      title: contentMeta?.title || '',
      content: contentMeta?.content || '',
    };
  }

  async indexPipelineFromLink(doc: Document) {
    // splitting / chunking
    const textSplitter = new RecursiveCharacterTextSplitter({
      separators: ['\n\n', '\n', ' ', ''],
      chunkSize: 1000,
      chunkOverlap: 200,
      lengthFunction: (str = '') => str.length || 0,
    });
    const documents = await textSplitter.splitDocuments([doc]);

    await this.vectorStore.addDocuments(documents);
  }

  async retrieval(query: string, filter) {
    /**
     * 1. 抽取关键字 or 实体
     * 2. 基于关键字多路召回
     * 3. rerank scores
     * 4. 取前
     */

    // 抽取关键字 or 实体
    const parser = new JsonOutputFunctionsParser();
    const runnable = await this.llm
      .bind({
        functions: [extractContentMeta.extractSearchKeyword],
        function_call: { name: 'keyword_for_search_engine' },
      })
      .pipe(parser);
    const res = (await runnable.invoke([new HumanMessage(query)])) as {
      keyword_list: string[];
    };

    // 基于关键字多路召回
    let results = [];
    await Promise.all(
      // 这里除了关键词，需要把 query 也带上
      [...(res?.keyword_list || []), query].map(async (keyword) => {
        const keywordRetrievalResults = await this.vectorStore.similaritySearch(
          keyword,
          5,
        );

        results = results.concat(keywordRetrievalResults);
      }),
    );

    // rerank scores
    // TODO: 这里只考虑了召回阈值和数量，默认取五个，但是没有考虑 token 窗口，未来需要优化
    results = uniqueFunc(results, 'content')
      .sort((a, b) => (b?.score || 0) - (a?.score || 0))
      // ?.filter((item) => item?.score >= 0.8)
      ?.slice(0, 6);

    return results;
  }

  async getRelatedQuestion(docs: Document[], lastQuery: string) {
    if (docs.length <= 0) return;

    let contextContent = docs.reduce((total, cur) => {
      total += `内容块:
      ===
      网页标题：${cur?.metadata?.title} 
      网页链接：${cur?.metadata?.source}
      网页内容：${cur.pageContent}
      ===
      `;

      return total;
    }, '');

    contextContent += lastQuery
      ? `\n用户上次提问：
    ===
    ${lastQuery}
    ===
    `
      : '';

    // 拼接提示
    contextContent = `## Context\n ${contextContent}`;

    const llm = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.1,
    });
    this.llm = llm;

    const parser = new JsonOutputFunctionsParser();
    const runnable = await this.llm
      .bind({
        functions: [
          generateAskFollowupQuestion.generateAskFollowupQuestionSchema,
        ],
        function_call: { name: 'get_ask_follow_up_questions' },
      })
      .pipe(parser);
    const askFollowUpQuestion = (await runnable.invoke([
      new SystemMessage(generateAskFollowupQuestion.systemPrompt),
      new HumanMessage(contextContent),
    ])) as {
      recommend_ask_followup_question: string[];
    };

    // TODO: need return topics、all weblinks
    return askFollowUpQuestion?.recommend_ask_followup_question || [];
  }

  async summary(
    prompt: string,
    docs: Document[],
    chatHistory: ChatMessage[],
    onMessage: (chunk: string) => void,
  ) {
    if (docs.length <= 0) return;

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    // 带元数据去拼 docs
    const weblinkDocs: Document[] = (
      await Promise.all(
        docs.map(async (doc) => {
          const { metadata } = doc;
          // 手动区分网页分割
          const dividerDocs = await textSplitter.createDocuments([
            `\n\n下面是网页 [${metadata?.title}](${metadata.source}) 的内容\n\n`,
          ]);
          const splittedChunks = await textSplitter.createDocuments([
            doc.pageContent,
          ]);
          return [...dividerDocs, ...splittedChunks];
        }),
      )
    ).flat();

    const combineLLM = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0,
      streaming: true,
      callbacks: [
        {
          handleLLMNewToken(token: string): Promise<void> | void {
            onMessage(token);
          },
        },
      ],
    });

    const customPrompt = new PromptTemplate({
      template: summarize.systemPrompt,
      inputVariables: ['text'],
    });
    const summarizeChain = loadSummarizationChain(this.llm, {
      type: 'map_reduce',
      combineLLM,
      combinePrompt: customPrompt,
    });
    await summarizeChain.invoke({
      input_documents: weblinkDocs,
    });
  }

  async chat(query: string, chatHistory: LLMChatMessage[], filter?: any) {
    this.logger.log(
      `activated with query: ${query}, filter: ${JSON.stringify(filter)}`,
    );

    // 构建总结的 Prompt，将 question + chatHistory 总结成
    const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
      ['system', contextualizeQA.systemPrompt],
      new MessagesPlaceholder('chatHistory'),
      ['human', '{question}'],
    ]);
    const contextualizeQChain = contextualizeQPrompt
      .pipe(this.llm as any)
      .pipe(new StringOutputParser());
    const questionWithContext =
      chatHistory.length === 0
        ? query
        : await contextualizeQChain.invoke({
            question: query,
            chatHistory,
          });

    const qaPrompt = ChatPromptTemplate.fromMessages([
      ['system', qa.systemPrompt],
      new MessagesPlaceholder('chatHistory'),
      ['human', `The context as follow:\n === \n {context} \n === \n`],
      ['human', '{question}'],
    ]);

    // 基于上下文进行问答
    const ragChain = await createStuffDocumentsChain({
      llm: this.llm,
      prompt: qaPrompt,
      outputParser: new StringOutputParser(),
    });

    const retrievalResults = await this.retrieval(questionWithContext, filter);

    console.log('retrievalResults', retrievalResults);

    const retrievedDocs = retrievalResults.map((res) => ({
      metadata: res?.metadata,
      pageContent: res?.pageContent as string,
      score: res?.score, // similarity score
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
