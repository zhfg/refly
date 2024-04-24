import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaVectorStore } from '@langchain/community/vectorstores/prisma';
import { Document } from '@langchain/core/documents';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { JsonOutputFunctionsParser } from 'langchain/output_parsers';

import { AigcContent, ContentVector, Prisma } from '@prisma/client';
import {
  qa,
  contextualizeQA,
  extractContentMeta,
  summarize,
  summarizeMultipleSource,
  summarizeConversation,
  extractSummarizeMeta,
  generateAskFollowupQuestion,
  searchEnhance,
} from '../prompts/index';
import { LLMChatMessage } from './schema';
import { HumanMessage, SystemMessage } from 'langchain/schema';

import { uniqueFunc } from '../utils/unique';
import { ContentMeta } from './dto';
import { categoryList } from '../prompts/utils/category';
import { Source } from '../types/weblink';
import { SearchResultContext } from '../types/search';
import { PrismaService } from '../common/prisma.service';
import { LOCALE } from 'src/types/task';

@Injectable()
export class LlmService implements OnModuleInit {
  private embeddings: OpenAIEmbeddings;
  private vectorStore: PrismaVectorStore<
    ContentVector,
    'content_vectors',
    any,
    any
  >;
  private llm: ChatOpenAI;
  private logger = new Logger(LlmService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-large',
      batchSize: 512,
      dimensions: this.configService.getOrThrow('vectorStore.vectorDim'),
      timeout: 5000,
      maxRetries: 3,
    });
    this.vectorStore = PrismaVectorStore.withModel<ContentVector>(
      this.prisma,
    ).create(this.embeddings, {
      prisma: Prisma,
      tableName: 'content_vectors' as any,
      vectorColumnName: 'vector',
      columns: {
        id: PrismaVectorStore.IdColumn,
        content: PrismaVectorStore.ContentColumn,
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
    const parser = new JsonOutputFunctionsParser();

    const runnable = await this.llm
      .bind({
        functions: [extractContentMeta.extractContentMetaSchema],
        function_call: { name: 'content_category_extractor' },
      })
      .pipe(parser);
    const res = (await runnable.invoke([
      new SystemMessage(extractContentMeta.systemPrompt),
      new HumanMessage(
        `The website content context as follow: \n ===\n ${doc.pageContent?.slice(
          0,
          12000,
        )} \n===`,
      ),
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

    this.logger.log(`final content meta: ${contentMeta}`);

    return contentMeta;
  }

  async getWebsiteMeta(
    doc: Document,
    locale: LOCALE = LOCALE.EN,
  ): Promise<Partial<AigcContent>> {
    const parser = new JsonOutputFunctionsParser();
    const runnable = await this.llm
      .bind({
        functions: [extractSummarizeMeta.extractWebsiteMetaSchema(locale)],
        function_call: {
          name: 'getWebsiteMeta',
        },
      })
      .pipe(parser);
    const summary = (await runnable.invoke([
      new SystemMessage(extractSummarizeMeta.extractMetaSystemPrompt),
      new HumanMessage(
        `The website content context as follow: \n ===\n ${doc.pageContent?.slice(
          0,
          12000,
        )} \n===`,
      ),
      new HumanMessage(`Please output answer in ${locale} language:`),
    ])) as {
      title: string;
      keywords: string;
    };
    this.logger.log('extract meta: %j', summary);

    return {
      title: summary?.title || '',
      meta: JSON.stringify({
        keywords: summary?.keywords || '',
      }),
    };
  }

  async summarizeContent(
    doc: Document,
    locale: LOCALE,
  ): Promise<Partial<AigcContent>> {
    const summary = await this.llm.invoke([
      new SystemMessage(extractSummarizeMeta.summarizeSystemPrompt),
      new HumanMessage(
        `The content to be summarized is as follows:\n` +
          `===\n ${doc.pageContent?.slice(0, 12000)} \n===\n` +
          `SUMMARY with **Chinese**:`,
      ),
      new HumanMessage(`Please output answer in ${locale} language:`),
    ]);
    this.logger.log('summarized content: %j', summary);

    return {
      content: summary?.text || '',
    };
  }

  /**
   * Apply content strategy.
   * @param doc
   * @returns
   */
  async applyStrategy(
    doc: Document,
    locale: LOCALE = LOCALE.EN,
  ): Promise<Partial<AigcContent>> {
    // direct apply summary and return with structed json format
    /**
     * 经过反复实验，gpt-3.5-turbo 的能力比较差，因此将这个任务拆成两个：1）meta 抽取（function call) 2）summary 生成（直接使用 GPT 输出）
     */
    const [meta, summary] = await Promise.all([
      this.getWebsiteMeta(doc, locale),
      this.summarizeContent(doc, locale),
    ]);

    return {
      title: meta?.title || '',
      abstract: summary?.content || '', // TODO: 概要暂时与正文相同
      content: summary?.content || '',
      meta: meta?.meta,
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
    locale: LOCALE = LOCALE.EN,
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
          summarizeMultipleSource.extractSummarizeMultipleSourceMetaSchema(
            locale,
          ),
        ],
        function_call: { name: 'content_meta_extractor' },
      })
      .pipe(parser);
    const contentMeta = (await runnable.invoke([
      new SystemMessage(summarizeMultipleSource.systemPrompt),
      new HumanMessage(multipleSourceInputContent),
      new HumanMessage(`Please output answer in ${locale} language:`),
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

  async summarizeConversation(
    messages: {
      type: string;
      content: string;
    }[],
  ): Promise<string> {
    const doc = new Document({
      pageContent: messages.map((m) => `${m.type}: ${m.content}`).join('\n'),
    });
    const summary = await this.llm.invoke([
      new SystemMessage(summarizeConversation.systemPrompt),
      new HumanMessage(
        `The conversation to be summarized is as follows:\n` +
          `===\n ${doc.pageContent?.slice(0, 12000)} \n===\n` +
          `SUMMARY with language used in the conversation:`,
      ),
    ]);
    this.logger.log(`summarized text: ${summary.text}`);

    return summary.text || '';
  }

  async indexPipelineFromLink(weblinkId: number, doc: Document) {
    // splitting / chunking
    const textSplitter = new RecursiveCharacterTextSplitter({
      separators: ['\n\n', '\n', ' ', ''],
      chunkSize: 1000,
      chunkOverlap: 200,
      lengthFunction: (str = '') => str.length || 0,
    });
    const documents = await textSplitter.splitDocuments([doc]);

    await this.vectorStore.addModels(
      await this.prisma.$transaction(
        documents.map(({ pageContent }) =>
          this.prisma.contentVector.create({
            data: { weblinkId, content: pageContent },
          }),
        ),
      ),
    );
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
    const runnable = this.llm
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

  async getRelatedQuestion(
    docs: Document[],
    lastQuery: string,
    locale: LOCALE,
  ) {
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
          generateAskFollowupQuestion.generateAskFollowupQuestionSchema(locale),
        ],
        function_call: { name: 'get_ask_follow_up_questions' },
      })
      .pipe(parser);
    const askFollowUpQuestion = (await runnable.invoke([
      new SystemMessage(generateAskFollowupQuestion.systemPrompt),
      new HumanMessage(contextContent),
      new HumanMessage(`Please output answer in ${locale} language:`),
    ])) as {
      recommend_ask_followup_question: string[];
    };

    // TODO: need return topics、all weblinks
    return askFollowUpQuestion?.recommend_ask_followup_question || [];
  }

  async summary(prompt: string, locale: LOCALE, docs: Document[]) {
    if (docs.length <= 0) return;

    const contextToCitationText = docs.reduce((total, cur) => {
      (total += `\n\n下面是网页 [${cur?.metadata?.title}](${cur?.metadata?.source}) 的内容\n\n`),
        (total += `\n===\n${cur?.pageContent}\n===\n\n`);

      return total;
    }, '');

    const llm = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.9,
      maxTokens: 1024,
    });

    const systemPrompt = summarize.systemPrompt.replace(
      `{text}`,
      contextToCitationText?.slice(0, 12000),
    );
    const stream = await llm.stream([
      new SystemMessage(systemPrompt),
      new HumanMessage(
        `The context to be summarized is as follows: \n ===\n ${contextToCitationText} \n ===`,
      ),
      new HumanMessage(`Please output the answer in ${locale} language:`),
    ]);

    return stream;
  }

  async getContextualQuestion(
    query: string,
    locale: LOCALE,
    chatHistory: LLMChatMessage[],
  ) {
    this.logger.log(
      `activated with query: ${query}, chat history: ${chatHistory}`,
    );

    // 构建总结的 Prompt，将 question + chatHistory 总结成
    const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
      ['system', contextualizeQA.systemPrompt(locale)],
      new MessagesPlaceholder('chatHistory'),
      [
        'human',
        `The user's question is {question}, please output answer in ${locale} language:`,
      ],
    ]);
    const contextualizeQChain = contextualizeQPrompt
      .pipe(this.llm as any)
      .pipe(new StringOutputParser());

    return await contextualizeQChain.invoke({
      question: query,
      chatHistory,
    });
  }

  async getRetrievalDocs(query: string, filter?: any) {
    this.logger.log(
      `activated with query: ${query}, filter: ${JSON.stringify(filter)}`,
    );

    const retrievalResults = await this.retrieval(query, filter);

    this.logger.log('retrievalResults', retrievalResults);

    const retrievedDocs = retrievalResults.map((res) => ({
      metadata: res?.metadata,
      pageContent: res?.pageContent as string,
      score: res?.score, // similarity score
    }));

    return retrievedDocs;
  }

  async chat(
    query: string,
    locale: LOCALE,
    chatHistory: LLMChatMessage[],
    context: Document[],
  ) {
    this.logger.log(`activated with query: ${query}}`);

    const qaPrompt = ChatPromptTemplate.fromMessages([
      ['system', qa.systemPrompt],
      new MessagesPlaceholder('chatHistory'),
      ['human', `The context as follow:\n === \n {context} \n === \n`],
      [
        'human',
        `The user's question is {question}, please output answer in ${locale} language:`,
      ],
    ]);

    // 基于上下文进行问答
    const ragChain = await createStuffDocumentsChain({
      llm: this.llm,
      prompt: qaPrompt,
      outputParser: new StringOutputParser(),
    });

    return {
      stream: ragChain.stream({
        question: query,
        context,
        chatHistory,
      }),
    };
  }

  async onlineSearch(
    query: string,
    locale: LOCALE,
  ): Promise<SearchResultContext[]> {
    let jsonContent: any = [];
    try {
      const REFERENCE_COUNT = 8;
      const DEFAULT_SEARCH_ENGINE_TIMEOUT = 5;
      const queryPayload = JSON.stringify({
        q: query,
        num: REFERENCE_COUNT,
        hl: locale?.toLocaleLowerCase(),
        gl: locale === LOCALE.EN ? 'us' : 'cn',
      });

      const res = await fetch('https://google.serper.dev/search', {
        method: 'post',
        headers: {
          'X-API-KEY': this.configService.get('serper.apiKey'),
          'Content-Type': 'application/json',
        },
        body: queryPayload,
      });
      jsonContent = await res.json();

      // convert to the same format as bing/google
      const contexts = [];
      if (jsonContent.hasOwnProperty('knowledgeGraph')) {
        const url =
          jsonContent.knowledgeGraph.descriptionUrl ||
          jsonContent.knowledgeGraph.website;
        const snippet = jsonContent.knowledgeGraph.description;
        if (url && snippet) {
          contexts.push({
            name: jsonContent.knowledgeGraph.title || '',
            url: url,
            snippet: snippet,
          });
        }
      }

      if (jsonContent.hasOwnProperty('answerBox')) {
        const url = jsonContent.answerBox.url;
        const snippet =
          jsonContent.answerBox.snippet || jsonContent.answerBox.answer;
        if (url && snippet) {
          contexts.push({
            name: jsonContent.answerBox.title || '',
            url: url,
            snippet: snippet,
          });
        }
      }
      if (jsonContent.hasOwnProperty('organic')) {
        for (const c of jsonContent.organic) {
          contexts.push({
            name: c.title,
            url: c.link,
            snippet: c.snippet || '',
          });
        }
      }
      return contexts.slice(0, REFERENCE_COUNT);
    } catch (e) {
      this.logger.error(`Error encountered: ${JSON.stringify(jsonContent)}`);
      return [];
    }
  }

  async searchEnhance(
    query: string,
    locale: LOCALE,
    chatHistory: LLMChatMessage[],
  ) {
    this.logger.log(`activated with query: ${query}, locale: ${locale}`);

    const stopWords = [
      '<|im_end|>',
      '[End]',
      '[end]',
      '\nReferences:\n',
      '\nSources:\n',
      'End.',
    ];

    // 构建总结的 Prompt，将 question + chatHistory 总结成
    const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
      ['system', contextualizeQA.systemPrompt(locale)],
      new MessagesPlaceholder('chatHistory'),
      [
        'human',
        `The user's question is {question}, please output answer in ${locale} language:`,
      ],
    ]);
    const contextualizeQChain = contextualizeQPrompt
      .pipe(this.llm as any)
      .pipe(new StringOutputParser());
    const questionWithContext =
      chatHistory.length === 1
        ? query
        : await contextualizeQChain.invoke({
            question: query,
            locale,
            chatHistory,
          });

    const contexts = await this.onlineSearch(questionWithContext, locale);
    const contextToCitationText = contexts
      .map((item, index) => `[[citation:${index + 1}]] ${item?.['snippet']}`)
      .join('\n\n');
    this.logger.log('search result contexts', contextToCitationText);
    // 临时先兼容基于文档召回的 sources 格式，快速实现联网搜索和联通前端
    const sources: Source[] = contexts.map((item) => ({
      pageContent: item.snippet,
      score: -1,
      metadata: {
        source: item.url,
        title: item.name,
      },
    }));

    const systemPrompt = searchEnhance.systemPrompt.replace(
      `{context}`,
      contextToCitationText,
    );

    const llm = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.9,
      maxTokens: 1024,
    });
    const stream = await llm.stream([
      new SystemMessage(systemPrompt),
      new HumanMessage(
        `The user's query is ${query}, please output answer in locale's ${locale} language:`,
      ),
    ]);

    return {
      sources,
      stream,
    };
  }
}
