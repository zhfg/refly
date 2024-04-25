import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import avro from 'avsc';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { TokenTextSplitter } from 'langchain/text_splitter';
import { generateUuid5 } from 'weaviate-ts-client';

import { WeaviateService } from '../common/weaviate.service';
import {
  ContentDataObj,
  ContentType,
  HybridSearchParam,
} from '../common/weaviate.dto';
import { User } from '@prisma/client';

const READER_URL = 'https://r.jina.ai/';

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
  private embeddings: OpenAIEmbeddings;
  private splitter: TokenTextSplitter;

  constructor(
    private config: ConfigService,
    private weaviate: WeaviateService,
  ) {
    this.embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-large',
      batchSize: 512,
      dimensions: this.config.getOrThrow('vectorStore.vectorDim'),
      timeout: 5000,
      maxRetries: 3,
    });
    this.splitter = new TokenTextSplitter({
      encodingName: 'cl100k_base',
      chunkSize: 800,
      chunkOverlap: 400,
    });
  }

  async parseWebpage(url: string): Promise<Document> {
    // TODO: error handling
    const response = await fetch(READER_URL + url);
    const text = await response.text();
    return { pageContent: text, metadata: {} };
  }

  async indexContent(param: {
    url: string;
    text?: string;
  }): Promise<ContentDataObj[]> {
    const { url, text } = param;

    const chunks = await this.splitter.splitText(text);
    const chunkEmbeds = await this.embeddings.embedDocuments(chunks);

    const dataObjs: ContentDataObj[] = [];
    for (let i = 0; i < chunks.length; i++) {
      dataObjs.push({
        id: generateUuid5(`${url}-${i}`),
        url,
        type: ContentType.weblink,
        title: chunks[i],
        content: chunks[i],
        vector: chunkEmbeds[i],
      });
    }

    return dataObjs;
  }

  async saveDataForUser(user: User, objList: ContentDataObj[]) {
    if (!user.vsTenantCreated) {
      await this.weaviate.createTenant(user.uid);
    }
    return this.weaviate.batchSaveData(user.uid, objList);
  }

  async retrieve(param: HybridSearchParam) {
    return this.weaviate.hybridSearch(param);
  }
}
