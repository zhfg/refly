import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import avro from 'avsc';
import { LRUCache } from 'lru-cache';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Embeddings } from '@langchain/core/embeddings';
import { OpenAIEmbeddings } from '@langchain/openai';
import { FireworksEmbeddings } from '@langchain/community/embeddings/fireworks';
import { cleanMarkdownForIngest } from '@refly/utils';

import { User } from '@prisma/client';
import { MinioService } from '../common/minio.service';
import {
  HybridSearchParam,
  ContentNode,
  ContentData,
  ContentPayload,
  ReaderResult,
  NodeMeta,
} from './rag.dto';
import { QdrantService } from '@/common/qdrant.service';
import { Condition, PointStruct } from '@/common/qdrant.dto';
import { genResourceUuid } from '@/utils';

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

@Injectable()
export class RAGService {
  private embeddings: Embeddings;
  private splitter: RecursiveCharacterTextSplitter;
  private cache: LRUCache<string, ReaderResult>; // url -> reader result
  private logger = new Logger(RAGService.name);

  constructor(
    private config: ConfigService,
    private minio: MinioService,
    private qdrant: QdrantService,
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

    // TODO: error handling
    // TODO: Jina token needs payment method
    const response = await fetch(READER_URL + url, {
      method: 'GET',
      headers: {
        // Authorization: this.config.get('rag.jinaToken')
        //   ? `Bearer ${this.config.get('rag.jinaToken')}`
        //   : undefined,
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

  async indexContent(doc: Document<NodeMeta>): Promise<ContentNode[]> {
    const { pageContent, metadata } = doc;
    const { nodeType, noteId, resourceId } = metadata;
    const docId = nodeType === 'note' ? noteId : resourceId;

    const chunks = await this.chunkText(pageContent);
    const chunkEmbeds = await this.embeddings.embedDocuments(chunks);

    const nodes: ContentNode[] = [];
    for (let i = 0; i < chunks.length; i++) {
      nodes.push({
        id: genResourceUuid(`${docId}-${i}`),
        vector: chunkEmbeds[i],
        payload: {
          ...metadata,
          seq: i,
          content: chunks[i],
        },
      });
    }

    return nodes;
  }

  /**
   * Save content chunks to object storage.
   */
  async saveContentChunks(storageKey: string, data: ContentData) {
    const buf = ContentAvroType.toBuffer(data);
    return this.minio.uploadData(storageKey, buf);
  }

  /**
   * Load content chunks from object storage.
   */
  async loadContentChunks(storageKey: string) {
    const buf = await this.minio.downloadData(storageKey);
    return ContentAvroType.fromBuffer(buf) as ContentData;
  }

  async saveDataForUser(user: Pick<User, 'id' | 'uid'>, data: ContentData) {
    const points: PointStruct[] = data.chunks.map((chunk) => ({
      id: chunk.id,
      vector: chunk.vector,
      payload: {
        ...chunk.payload,
        tenantId: user.uid,
      },
    }));

    return this.qdrant.batchSaveData(points);
  }

  async deleteResourceNodes(user: Pick<User, 'uid'>, resourceId: string) {
    return this.qdrant.batchDelete({
      must: [
        { key: 'tenantId', match: { value: user.uid } },
        { key: 'resourceId', match: { value: resourceId } },
      ],
    });
  }

  async deleteNoteNodes(user: Pick<User, 'uid'>, noteId: string) {
    return this.qdrant.batchDelete({
      must: [
        { key: 'tenantId', match: { value: user.uid } },
        { key: 'noteId', match: { value: noteId } },
      ],
    });
  }

  async retrieve(user: Pick<User, 'uid'>, param: HybridSearchParam): Promise<ContentPayload[]> {
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
}
