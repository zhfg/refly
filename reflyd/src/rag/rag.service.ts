import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import avro from 'avsc';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { TokenTextSplitter } from 'langchain/text_splitter';
import { generateUuid5 } from 'weaviate-ts-client';

import { tables } from 'turndown-plugin-gfm';
import normalizeUrl from '@esm2cjs/normalize-url';
import TurndownService from 'turndown';
import { tidyMarkdown } from '../utils/markdown';

import { User } from '@prisma/client';
import { PageSnapshot, PuppeteerService, ScrappingOptions } from '../common/puppeteer.service';
import { WeaviateService } from '../common/weaviate.service';
import {
  ContentDataObj,
  ContentData,
  ContentType,
  HybridSearchParam,
} from '../common/weaviate.dto';
import { PageMeta } from '../types/weblink';

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
  private logger = new Logger(RAGService.name);

  turnDownPlugins = [tables];

  constructor(
    private config: ConfigService,
    private weaviate: WeaviateService,
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

  getTurndown(noRules?: boolean | string) {
    const turnDownService = new TurndownService();
    if (!noRules) {
      turnDownService.addRule('remove-irrelevant', {
        filter: ['meta', 'style', 'script', 'noscript', 'link', 'textarea'],
        replacement: () => '',
      });
      turnDownService.addRule('title-as-h1', {
        filter: ['title'],
        replacement: (innerText) => `${innerText}\n===============\n`,
      });
    }

    return turnDownService;
  }

  async formatSnapshot(
    mode: string | 'markdown' | 'html' | 'text',
    snapshot: PageSnapshot & {
      screenshotUrl?: string;
    },
    nominalUrl?: URL,
  ): Promise<Document<PageMeta>> {
    const toBeTurnedToMd = mode === 'markdown' ? snapshot.html : snapshot.parsed?.content;
    let turnDownService =
      mode === 'markdown' ? this.getTurndown() : this.getTurndown('without any rule');
    for (const plugin of this.turnDownPlugins) {
      turnDownService = turnDownService.use(plugin);
    }

    let contentText = '';
    if (toBeTurnedToMd) {
      try {
        contentText = turnDownService.turndown(toBeTurnedToMd).trim();
      } catch (err) {
        this.logger.error(`Turndown failed to run, retrying without plugins: ${err}`);
        const vanillaTurnDownService = this.getTurndown();
        try {
          contentText = vanillaTurnDownService.turndown(toBeTurnedToMd).trim();
        } catch (err2) {
          this.logger.error(`Turndown failed to run, giving up: ${err2}`);
        }
      }
    }

    if (
      !contentText ||
      (contentText.startsWith('<') && contentText.endsWith('>') && toBeTurnedToMd !== snapshot.html)
    ) {
      try {
        contentText = turnDownService.turndown(snapshot.html);
      } catch (err) {
        this.logger.warn(`Turndown failed to run, retrying without plugins`, { err });
        const vanillaTurnDownService = this.getTurndown();
        try {
          contentText = vanillaTurnDownService.turndown(snapshot.html);
        } catch (err2) {
          this.logger.warn(`Turndown failed to run, giving up`, { err: err2 });
        }
      }
    }
    if (!contentText || contentText.startsWith('<') || contentText.endsWith('>')) {
      contentText = snapshot.text;
    }

    return {
      pageContent: tidyMarkdown(contentText || '').trim(),
      metadata: {
        title: (snapshot.parsed?.title || snapshot.title || '').trim(),
        source: nominalUrl?.toString() || snapshot.href?.trim(),
        publishedTime: snapshot.parsed?.publishedTime || undefined,
      },
    };
  }

  async crawl(url: string, mode = 'markdown') {
    const noSlashURL = url.slice(1);
    let urlToCrawl: URL;
    try {
      urlToCrawl = new URL(
        normalizeUrl(noSlashURL.trim(), {
          stripWWW: false,
          removeTrailingSlash: false,
          removeSingleSlash: false,
        }),
      );
    } catch (err) {
      throw new Error(`Invalid URL: ${noSlashURL}`);
    }
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

      const formatted = await this.formatSnapshot(customMode, scrapped, urlToCrawl);

      return formatted;
    }

    if (!lastScrapped) {
      throw new Error(`No content available for URL ${urlToCrawl}`);
    }

    return await this.formatSnapshot(customMode, lastScrapped, urlToCrawl);
  }

  async crawlFromRemoteReader(url: string): Promise<Document<PageMeta>> {
    // TODO: error handling
    const response = await fetch(READER_URL + url);
    const text = await response.text();
    return { pageContent: text, metadata: { source: url, title: '' } }; // TODO: page title
  }

  async indexContent(param: { url: string; text?: string }): Promise<ContentDataObj[]> {
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

  async saveDataForUser(user: User, data: ContentData) {
    if (!user.vsTenantCreated) {
      await this.weaviate.createTenant(user.uid);
    }
    return this.weaviate.batchSaveData(user.uid, data.chunks);
  }

  async retrieve(param: HybridSearchParam) {
    return this.weaviate.hybridSearch(param);
  }
}
