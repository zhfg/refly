import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import _ from 'lodash';
import avro from 'avsc';
import { Document } from '@langchain/core/documents';
import { TokenTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';

import { tables } from 'turndown-plugin-gfm';
import TurndownService from 'turndown';
import { cleanMarkdownForLLM, tidyMarkdown } from '../utils/markdown';

import { User } from '@prisma/client';
import { MinioService } from '../common/minio.service';
import { PageSnapshot, PuppeteerService, ScrappingOptions } from '../common/puppeteer.service';
import {
  HybridSearchParam,
  ContentDataObj,
  ContentData,
  ContentType,
  ContentPayload,
} from './rag.dto';
import { PageMeta } from '../types/weblink';
import { normalizeURL } from '../utils/url';
import { QdrantService } from 'src/common/qdrant.service';
import { Condition, PointStruct } from 'src/common/qdrant.dto';

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
  private embeddings: OpenAIEmbeddings;
  private splitter: TokenTextSplitter;
  private logger = new Logger(RAGService.name);

  turnDownPlugins = [tables];

  constructor(
    private config: ConfigService,
    private minio: MinioService,
    private qdrant: QdrantService,
    private puppeteer: PuppeteerService,
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

  getTurndown(mode: FormatMode) {
    const turnDownService = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
    });
    if (mode === 'render') {
      turnDownService.addRule('remove-irrelevant', {
        filter: ['meta', 'style', 'script', 'noscript', 'link', 'textarea'],
        replacement: () => '',
      });
    } else if (mode === 'ingest') {
      turnDownService.addRule('remove-irrelevant', {
        filter: ['meta', 'style', 'script', 'noscript', 'link', 'textarea', 'img'],
        replacement: () => '',
      });
      turnDownService.addRule('unlink', {
        filter: ['a'],
        replacement: (content, node, options) => node.textContent,
      });
    }

    return turnDownService;
  }

  convertHTMLToMarkdown(mode: FormatMode, html: string): string {
    const toBeTurnedToMd = html;
    let turnDownService = this.getTurndown(mode);
    for (const plugin of this.turnDownPlugins) {
      turnDownService = turnDownService.use(plugin);
    }

    let contentText = '';
    if (toBeTurnedToMd) {
      try {
        contentText = turnDownService.turndown(toBeTurnedToMd).trim();
      } catch (err) {
        this.logger.error(`Turndown failed to run, retrying without plugins: ${err}`);
        const vanillaTurnDownService = this.getTurndown('vanilla');
        try {
          contentText = vanillaTurnDownService.turndown(toBeTurnedToMd).trim();
        } catch (err2) {
          this.logger.error(`Turndown failed to run, giving up: ${err2}`);
        }
      }
    }

    if (
      !contentText ||
      (contentText.startsWith('<') && contentText.endsWith('>') && toBeTurnedToMd !== html)
    ) {
      try {
        contentText = turnDownService.turndown(html);
      } catch (err) {
        this.logger.warn(`Turndown failed to run, retrying without plugins`, { err });
        const vanillaTurnDownService = this.getTurndown('vanilla');
        try {
          contentText = vanillaTurnDownService.turndown(html);
        } catch (err2) {
          this.logger.warn(`Turndown failed to run, giving up`, { err: err2 });
        }
      }
    }

    return tidyMarkdown(contentText || '').trim();
  }

  async crawl(url: string, mode = 'markdown') {
    const urlToCrawl = new URL(normalizeURL(url.trim()));
    if (urlToCrawl.protocol !== 'http:' && urlToCrawl.protocol !== 'https:') {
      throw new Error(`Invalid protocol ${urlToCrawl.protocol}`);
    }

    const customMode = mode || 'default';

    const crawlOpts: ScrappingOptions = {
      favorScreenshot: customMode === 'screenshot',
    };

    let lastScrapped: PageSnapshot | undefined;

    for await (const scrapped of this.puppeteer.scrap(urlToCrawl, crawlOpts)) {
      lastScrapped = scrapped;
      if (!scrapped?.parsed?.content || !scrapped.title?.trim()) {
        continue;
      }

      return scrapped;
    }

    if (!lastScrapped) {
      throw new Error(`No content available for URL ${urlToCrawl}`);
    }

    return lastScrapped;
  }

  async crawlFromRemoteReader(url: string): Promise<Document<PageMeta>> {
    // TODO: error handling
    const response = await fetch(READER_URL + url);
    const text = await response.text();
    return { pageContent: text, metadata: { source: url, title: '' } }; // TODO: page title
  }

  async chunkText(text: string) {
    return await this.splitter.splitText(cleanMarkdownForLLM(text));
  }

  async indexContent(doc: Document<PageMeta>): Promise<ContentDataObj[]> {
    const { pageContent, metadata } = doc;

    const chunks = await this.chunkText(pageContent);
    const chunkEmbeds = await this.embeddings.embedDocuments(chunks);

    const dataObjs: ContentDataObj[] = [];
    for (let i = 0; i < chunks.length; i++) {
      dataObjs.push({
        id: '', // leave it empty for future update
        url: metadata.source,
        type: ContentType.WEBLINK,
        title: metadata.title,
        content: chunks[i],
        vector: chunkEmbeds[i],
      });
    }

    return dataObjs;
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
        ..._.omit(chunk, ['id', 'vector']),
        tenantId: user.uid,
      },
    }));

    return this.qdrant.batchSaveData(points);
  }

  async deleteResourceData(user: Pick<User, 'uid'>, resourceId: string) {
    return this.qdrant.batchDelete({
      must: [
        { key: 'tenantId', match: { value: user.uid } },
        { key: 'resourceId', match: { value: resourceId } },
      ],
    });
  }

  async retrieve(user: Pick<User, 'uid'>, param: HybridSearchParam): Promise<ContentPayload[]> {
    if (!param.vector) {
      param.vector = await this.embeddings.embedQuery(param.query);
    }

    const conditions: Condition[] = [
      {
        key: 'tenantId',
        match: { value: user.uid },
      },
    ];

    if (param.filter?.urls?.length > 0) {
      conditions.push({
        key: 'url',
        match: { any: param.filter?.urls },
      });
    }
    if (param.filter?.resourceIds?.length > 0) {
      conditions.push({
        key: 'url',
        match: { any: param.filter?.resourceIds },
      });
    }
    if (param.filter?.collectionIds?.length > 0) {
      conditions.push({
        key: 'url',
        match: { any: param.filter?.resourceIds },
      });
    }

    const results = await this.qdrant.search(param, { must: conditions });
    return results.map((res) => res.payload as any);
  }
}
