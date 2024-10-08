import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import avro from 'avsc';
import { LRUCache } from 'lru-cache';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Embeddings } from '@langchain/core/embeddings';
import { OpenAIEmbeddings } from '@langchain/openai';
import { FireworksEmbeddings } from '@langchain/community/embeddings/fireworks';
import { cleanMarkdownForIngest } from '@refly-packages/utils';

import { SearchResult, User } from '@refly-packages/openapi-schema';
import { MINIO_INTERNAL, MinioService } from '@/common/minio.service';
import { HybridSearchParam, ContentData, ContentPayload, ReaderResult, NodeMeta } from './rag.dto';
import { QdrantService } from '@/common/qdrant.service';
import { Condition, PointStruct } from '@/common/qdrant.dto';
import { genResourceUuid, streamToBuffer } from '@/utils';

const READER_URL = 'https://r.jina.ai/';

export type FormatMode =
  | 'render' // For markdown rendering
  | 'ingest' // For consumption by LLMs
  | 'vanilla'; // Without any processing;

export const ChunkAvroType = avro.Type.forSchema({
  type: 'record',
  name: 'Chunk',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'url', type: 'string' },
    { name: 'type', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'content', type: 'string' },
    { name: 'vector', type: { type: 'array', items: 'float' } },
  ],
});

export const ContentAvroType = avro.Type.forSchema({
  type: 'record',
  name: 'ContentChunks',
  fields: [
    {
      name: 'chunks',
      type: { type: 'array', items: ChunkAvroType },
    },
  ],
});

export const PARSER_VERSION = '20240424';

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
    if (process.env.NODE_ENV === 'development') {
      this.embeddings = new FireworksEmbeddings({
        modelName: 'nomic-ai/nomic-embed-text-v1.5',
        batchSize: 512,
        maxRetries: 3,
      });
    } else {
      this.embeddings = new OpenAIEmbeddings({
        modelName: 'text-embedding-3-large',
        batchSize: 512,
        dimensions: this.config.getOrThrow('vectorStore.vectorDim'),
        timeout: 5000,
        maxRetries: 3,
      });
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
        this.config.get('rag.jinaToken') ? `Bearer ${this.config.get('rag.jinaToken')}` : undefined
      }`,
    );

    const response = await fetch(READER_URL + url, {
      method: 'GET',
      headers: {
        Authorization:
          process.env.NODE_ENV === 'production' && this.config.get('rag.jinaToken')
            ? `Bearer ${this.config.get('rag.jinaToken')}`
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

  async indexContent(user: User, doc: Document<NodeMeta>): Promise<{ size: number }> {
    const { uid } = user;
    const { pageContent, metadata } = doc;
    const { nodeType, noteId, resourceId } = metadata;
    const docId = nodeType === 'note' ? noteId : resourceId;

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

  /**
   * Save content chunks to object storage.
   */
  async saveContentChunks(storageKey: string, data: ContentData) {
    const buf = ContentAvroType.toBuffer(data);
    return this.minio.client.putObject(storageKey, buf);
  }

  /**
   * Load content chunks from object storage.
   */
  async loadContentChunks(storageKey: string) {
    const readable = await this.minio.client.getObject(storageKey);
    const buffer = await streamToBuffer(readable);
    return ContentAvroType.fromBuffer(buffer) as ContentData;
  }

  async deleteResourceNodes(user: User, resourceId: string) {
    return this.qdrant.batchDelete({
      must: [
        { key: 'tenantId', match: { value: user.uid } },
        { key: 'resourceId', match: { value: resourceId } },
      ],
    });
  }

  async deleteNoteNodes(user: User, noteId: string) {
    return this.qdrant.batchDelete({
      must: [
        { key: 'tenantId', match: { value: user.uid } },
        { key: 'noteId', match: { value: noteId } },
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
    if (param.filter?.noteIds?.length > 0) {
      conditions.push({
        key: 'noteId',
        match: { any: param.filter?.noteIds },
      });
    }
    if (param.filter?.resourceIds?.length > 0) {
      conditions.push({
        key: 'resourceId',
        match: { any: param.filter?.resourceIds },
      });
    }
    if (param.filter?.collectionIds?.length > 0) {
      conditions.push({
        key: 'collectionId',
        match: { any: param.filter?.collectionIds },
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
      contentMap.set(r.content.join('\n\n'), r);
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
          Authorization: `Bearer ${this.config.getOrThrow('rag.jinaToken')}`,
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
