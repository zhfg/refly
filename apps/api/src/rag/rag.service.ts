import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LRUCache } from 'lru-cache';
import { Document, DocumentInterface } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Embeddings } from '@langchain/core/embeddings';
import { OpenAIEmbeddings } from '@langchain/openai';
import { FireworksEmbeddings } from '@langchain/community/embeddings/fireworks';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { cleanMarkdownForIngest } from '@refly-packages/utils';

import { SearchResult, User } from '@refly-packages/openapi-schema';
import { MINIO_INTERNAL, MinioService } from '@/common/minio.service';
import { HybridSearchParam, ContentPayload, ReaderResult, NodeMeta } from './rag.dto';
import { QdrantService } from '@/common/qdrant.service';
import { Condition, PointStruct } from '@/common/qdrant.dto';
import { genResourceUuid } from '@/utils';
import { JinaEmbeddings } from '@/utils/embeddings/jina';

const READER_URL = 'https://r.jina.ai/';

interface JinaRerankerResponse {
  results: {
    document: { text: string };
    relevance_score: number;
  }[];
}

@Injectable()
export class RAGService {
  private embeddings: Embeddings;
  private splitter: RecursiveCharacterTextSplitter;
  private cache: LRUCache<string, ReaderResult>; // url -> reader result
  private logger = new Logger(RAGService.name);

  constructor(
    private config: ConfigService,
    private qdrant: QdrantService,
    @Inject(MINIO_INTERNAL) private minio: MinioService,
  ) {
    const provider = this.config.get('embeddings.provider');
    if (provider === 'fireworks') {
      this.embeddings = new FireworksEmbeddings({
        modelName: this.config.getOrThrow('embeddings.modelName'),
        batchSize: this.config.getOrThrow('embeddings.batchSize'),
        maxRetries: 3,
      });
    } else if (provider === 'jina') {
      this.embeddings = new JinaEmbeddings({
        modelName: this.config.getOrThrow('embeddings.modelName'),
        batchSize: this.config.getOrThrow('embeddings.batchSize'),
        dimensions: this.config.getOrThrow('embeddings.dimensions'),
        apiKey: this.config.getOrThrow('credentials.jina'),
        maxRetries: 3,
      });
    } else if (provider === 'openai') {
      this.embeddings = new OpenAIEmbeddings({
        modelName: this.config.getOrThrow('embeddings.modelName'),
        batchSize: this.config.getOrThrow('embeddings.batchSize'),
        dimensions: this.config.getOrThrow('embeddings.dimensions'),
        timeout: 5000,
        maxRetries: 3,
      });
    } else {
      throw new Error(`Unsupported embeddings provider: ${provider}`);
    }

    this.splitter = RecursiveCharacterTextSplitter.fromLanguage('markdown', {
      chunkSize: 1000,
      chunkOverlap: 0,
    });
    this.cache = new LRUCache({ max: 1000 });
  }

  async crawlFromRemoteReader(url: string): Promise<ReaderResult> {
    if (this.cache.get(url)) {
      this.logger.log(`in-mem crawl cache hit: ${url}`);
      return this.cache.get(url) as ReaderResult;
    }

    this.logger.log(
      `Authorization: ${
        this.config.get('credentials.jina')
          ? `Bearer ${this.config.get('credentials.jina')}`
          : undefined
      }`,
    );

    const response = await fetch(READER_URL + url, {
      method: 'GET',
      headers: {
        Authorization: this.config.get('credentials.jina')
          ? `Bearer ${this.config.get('credentials.jina')}`
          : undefined,
        Accept: 'application/json',
      },
    });
    if (response.status !== 200) {
      throw new Error(
        `call remote reader failed: ${response.status} ${response.statusText} ${response.text}`,
      );
    }

    const data = await response.json();
    if (!data) {
      throw new Error(`invalid data from remote reader: ${response.text}`);
    }

    this.logger.log(`crawl from reader success: ${url}`);
    this.cache.set(url, data);

    return data;
  }

  async chunkText(text: string) {
    return await this.splitter.splitText(cleanMarkdownForIngest(text));
  }

  // metadata?.uniqueId for save or retrieve
  async inMemorySearchWithIndexing(
    user: User,
    options: {
      content: string | Document<any> | Array<Document<any>>;
      query?: string;
      k?: number;
      filter?: (doc: Document<NodeMeta>) => boolean;
      needChunk?: boolean;
      additionalMetadata?: Record<string, any>;
    },
  ): Promise<DocumentInterface[]> {
    const { content, query, k = 10, filter, needChunk = true, additionalMetadata = {} } = options;
    const { uid } = user;

    if (!query) {
      return [];
    }

    // Create a temporary MemoryVectorStore for this operation
    const tempMemoryVectorStore = new MemoryVectorStore(this.embeddings);

    // Prepare the document
    let documents: Document<any>[];
    if (Array.isArray(content)) {
      documents = content.map((doc) => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          tenantId: uid,
          ...additionalMetadata,
        },
      }));
    } else {
      let doc: Document<any>;
      if (typeof content === 'string') {
        doc = {
          pageContent: content,
          metadata: {
            tenantId: uid,
            ...additionalMetadata,
          },
        };
      } else {
        doc = {
          ...content,
          metadata: {
            ...content.metadata,
            tenantId: uid,
            ...additionalMetadata,
          },
        };
      }

      // Index the content
      const chunks = needChunk ? await this.chunkText(doc.pageContent) : [doc.pageContent];
      let startIndex = 0;
      documents = chunks.map((chunk) => {
        const document = {
          pageContent: chunk.trim(),
          metadata: {
            ...doc.metadata,
            tenantId: uid,
            ...additionalMetadata,
            start: startIndex,
            end: startIndex + chunk.trim().length,
          },
        };

        startIndex += chunk.trim().length;

        return document;
      });
    }

    await tempMemoryVectorStore.addDocuments(documents);

    // Perform the search
    const wrapperFilter = (doc: Document<NodeMeta>) => {
      // Always check for tenantId
      const tenantIdMatch = doc.metadata.tenantId === uid;

      // If filter is undefined, only check tenantId
      if (filter === undefined) {
        return tenantIdMatch;
      }

      // If filter is defined, apply both filter and tenantId check
      return filter(doc) && tenantIdMatch;
    };

    return tempMemoryVectorStore.similaritySearch(query, k, wrapperFilter);
  }

  async indexDocument(user: User, doc: Document<NodeMeta>): Promise<{ size: number }> {
    const { uid } = user;
    const { pageContent, metadata } = doc;
    const { nodeType, canvasId, resourceId } = metadata;
    const docId = nodeType === 'canvas' ? canvasId : resourceId;

    const chunks = await this.chunkText(pageContent);
    const chunkEmbeds = await this.embeddings.embedDocuments(chunks);

    const points: PointStruct[] = [];
    for (let i = 0; i < chunks.length; i++) {
      points.push({
        id: genResourceUuid(`${docId}-${i}`),
        vector: chunkEmbeds[i],
        payload: {
          ...metadata,
          seq: i,
          content: chunks[i],
          tenantId: uid,
        },
      });
    }

    await this.qdrant.batchSaveData(points);

    return { size: QdrantService.estimatePointsSize(points) };
  }

  async deleteResourceNodes(user: User, resourceId: string) {
    return this.qdrant.batchDelete({
      must: [
        { key: 'tenantId', match: { value: user.uid } },
        { key: 'resourceId', match: { value: resourceId } },
      ],
    });
  }

  async deleteCanvasNodes(user: User, canvasId: string) {
    return this.qdrant.batchDelete({
      must: [
        { key: 'tenantId', match: { value: user.uid } },
        { key: 'canvasId', match: { value: canvasId } },
      ],
    });
  }

  async retrieve(user: User, param: HybridSearchParam): Promise<ContentPayload[]> {
    if (!param.vector) {
      param.vector = await this.embeddings.embedQuery(param.query);
      // param.vector = Array(256).fill(0);
    }

    const conditions: Condition[] = [
      {
        key: 'tenantId',
        match: { value: user.uid },
      },
    ];

    if (param.filter?.nodeTypes?.length > 0) {
      conditions.push({
        key: 'nodeType',
        match: { any: param.filter?.nodeTypes },
      });
    }
    if (param.filter?.urls?.length > 0) {
      conditions.push({
        key: 'url',
        match: { any: param.filter?.urls },
      });
    }
    if (param.filter?.canvasIds?.length > 0) {
      conditions.push({
        key: 'canvasId',
        match: { any: param.filter?.canvasIds },
      });
    }
    if (param.filter?.resourceIds?.length > 0) {
      conditions.push({
        key: 'resourceId',
        match: { any: param.filter?.resourceIds },
      });
    }
    if (param.filter?.projectIds?.length > 0) {
      conditions.push({
        key: 'projectId',
        match: { any: param.filter?.projectIds },
      });
    }

    const results = await this.qdrant.search(param, { must: conditions });
    return results.map((res) => res.payload as any);
  }

  /**
   * Rerank search results using Jina Reranker.
   */
  async rerank(query: string, results: SearchResult[]): Promise<SearchResult[]> {
    const contentMap = new Map<string, SearchResult>();
    results.forEach((r) => {
      contentMap.set(r.snippets.map((s) => s.text).join('\n\n'), r);
    });

    const payload = JSON.stringify({
      query,
      model: this.config.get('reranker.model'),
      top_n: this.config.get('reranker.topN'),
      documents: Array.from(contentMap.keys()),
    });

    try {
      const res = await fetch('https://api.jina.ai/v1/rerank', {
        method: 'post',
        headers: {
          Authorization: `Bearer ${this.config.getOrThrow('credentials.jina')}`,
          'Content-Type': 'application/json',
        },
        body: payload,
      });
      const data: JinaRerankerResponse = await res.json();
      this.logger.debug(`Jina reranker results: ${JSON.stringify(data)}`);

      return data.results
        .filter((r) => r.relevance_score >= this.config.get('reranker.relevanceThreshold'))
        .map((r) => contentMap.get(r.document.text) as SearchResult);
    } catch (e) {
      this.logger.error(`Reranker failed, fallback to default: ${e.stack}`);
      return results;
    }
  }
}
