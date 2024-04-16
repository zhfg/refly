import { Injectable, Logger } from '@nestjs/common';
import { Prisma, Weblink } from '@prisma/client';
import { Queue } from 'bull';
import { createHash } from 'crypto';
import { LRUCache } from 'lru-cache';
import { InjectQueue } from '@nestjs/bull';
import * as cheerio from 'cheerio';
import { Document } from '@langchain/core/documents';
import { CheerioWebBaseLoader } from 'langchain/document_loaders/web/cheerio';
import { parse } from 'node-html-parser';

import { PrismaService } from '../common/prisma.service';
import { MinioService } from '../common/minio.service';
import { AigcService } from '../aigc/aigc.service';
import { WebLinkDTO } from './dto';
import { getExpectedTokenLenContent } from '../utils/token';
import { PageMeta, Source } from '../types/weblink';
import { QUEUE_STORE_LINK } from '../utils/const';
import { ConfigService } from '@nestjs/config';
import { streamToString } from '../utils/stream';

@Injectable()
export class WeblinkService {
  private readonly logger = new Logger(WeblinkService.name);
  private cache: LRUCache<string, string>; // url -> document
  private bucketName: string;

  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
    private configService: ConfigService,
    private aigcService: AigcService,
    @InjectQueue(QUEUE_STORE_LINK) private indexQueue: Queue<WebLinkDTO>,
  ) {
    this.cache = new LRUCache({
      max: 1000,
    });
    this.bucketName = this.configService.getOrThrow('minio.weblinkBucket');
  }

  async checkWeblinkExists(url: string) {
    return this.prisma.weblink.findUnique({
      select: { id: true },
      where: { url },
    });
  }

  /**
   * Preprocess and filter links, then send to processing queue
   * @param userId user id
   * @param links link history data
   */
  async storeLinks(userId: number, links: WebLinkDTO[]) {
    if (!links) return;

    // Aggregate links (pick the last visit one)
    const linkMap = new Map<string, WebLinkDTO>();
    links.forEach((link) => {
      // TODO: pre filtering (with bloom filter, etc.)
      const url = stripURL(link.url);
      if (!linkMap.has(url)) {
        link.userId = userId;
        return linkMap.set(url, link);
      }
      if (link.lastVisitTime > linkMap.get(link.url).lastVisitTime) {
        linkMap.get(url).lastVisitTime = link.lastVisitTime;
      }
      linkMap.get(url).visitCount += link.visitCount;
      linkMap.get(url).readTime += link.readTime;
    });

    // Send to queue in a non-block style
    // linkMap.forEach((link) => this.indexQueue.add('indexWebLink', link));
    try {
      linkMap.forEach((link) => this.processLinkFromStoreQueue(link));
    } catch (err) {
      this.logger.error(`process weblink err: ${err}`);
    }
  }

  async createNewLink(link: WebLinkDTO, pageMeta: PageMeta) {
    return this.prisma.weblink.create({
      data: {
        url: link.url,
        indexStatus: 'processing',
        pageContent: '', // deprecated, always empty
        storageKey: link.storageKey,
        pageMeta: JSON.stringify(pageMeta),
        contentMeta: '',
      },
    });
  }

  async getUserHistory(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWeblinkWhereUniqueInput;
    where?: Prisma.UserWeblinkWhereInput;
    orderBy?: Prisma.WeblinkOrderByWithRelationInput;
  }) {
    return this.prisma.userWeblink.findMany(params);
  }

  /**
   * Parse the content of a webpage link using cheerio.
   *
   * @param {string} url - The URL of the webpage to parse
   * @return {Promise<Document>} A Promise that resolves to the parsed document
   */
  async parseWebLinkContent(url: string): Promise<Document> {
    // Check if the document is in the cache
    if (this.cache.has(url)) {
      this.logger.log(`in-mem cache hit: ${url}`);
      return JSON.parse(this.cache.get(url));
    }

    // Check if the document is in the database
    const weblink = await this.prisma.weblink.findUnique({
      select: { storageKey: true, pageMeta: true },
      where: { url },
    });
    if (weblink) {
      this.logger.log(`found weblink in db: ${url}`);
      const content = await this.minio.getObject(
        this.bucketName,
        weblink.storageKey,
      );

      const doc = new Document({
        pageContent: await streamToString(content),
        metadata: JSON.parse(weblink.pageMeta),
      });
      this.cache.set(url, JSON.stringify(doc));
      return doc;
    }

    // Finally tries to fetch the content from the web
    try {
      const loader = new CheerioWebBaseLoader(url, {
        maxRetries: 3,
        timeout: 5000,
      });

      // customized webpage loading
      const $ = await loader.scrape();
      // remove all styles and scripts tag
      $('script, style, plasmo-csui, img, svg, meta, link').remove();
      // remove comments blocks
      $('body')
        .contents()
        .each((i, node) => {
          if (node.type === 'comment') {
            $(node).remove();
          }
        });

      // only get meaning content
      const pageContent = $.html();
      const title = $('title').text();
      const source = loader.webPath;
      const doc = { pageContent, metadata: { title, source } };
      this.cache.set(url, JSON.stringify(doc));
      return doc;
    } catch (err) {
      this.logger.error(`process url ${url} failed: ${err}`);
      return null;
    }
  }

  /**
   * Directly parse html content.
   * @param pageContent raw html page content
   * @returns nothing
   */
  async downloadWebLinkContent(
    url: string,
    storageKey: string,
  ): Promise<Document> {
    try {
      const stream = await this.minio.getObject(this.bucketName, storageKey);
      const content = await streamToString(stream);
      const $ = cheerio.load(content);

      // only get meaning content
      const title = $('title').text();
      const source = url;

      return { pageContent: content, metadata: { title, source } };
    } catch (err) {
      this.logger.error(`process url ${url} failed: ${err}`);
      return null;
    }
  }

  /**
   * Parse multiple weblinks concurrently.
   * @param weblinkList input weblinks
   * @returns langchain documents
   */
  async parseMultiWeblinks(weblinkList: Source[]): Promise<Document[]> {
    // 处理 token 窗口，一共给 6K 窗口用于问答，平均分到每个网页，保障可用性
    const avgTokenLen = 6000 / weblinkList?.length;

    const results = await Promise.all<Document[]>(
      weblinkList.map(async (item) => {
        // If selections are provided, use the selected content
        if (item.selections?.length > 0) {
          return item.selections.map(({ content }) => ({
            pageContent: content,
            metadata: item.metadata,
          }));
        }

        const { pageContent, metadata } = await this.parseWebLinkContent(
          item.metadata?.source,
        );
        return [
          {
            pageContent:
              getExpectedTokenLenContent(pageContent, avgTokenLen) || '',
            metadata,
          },
        ];
      }),
    );

    return results.flat();
  }

  async saveWeblinkUserMarks(param: {
    userId: number;
    weblinkList: Source[];
    extensionVersion?: string;
  }) {
    const { userId, weblinkList, extensionVersion = '' } = param;
    const weblinks = await this.prisma.weblink.findMany({
      select: { id: true, url: true },
      where: {
        url: { in: weblinkList.map((item) => item.metadata.source) },
      },
    });
    const weblinkIdMap = weblinks.reduce((map, item) => {
      map.set(item.url, item.id);
      return map;
    }, new Map<string, number>());
    this.logger.log(`weblinkIdMap: ${JSON.stringify(weblinkIdMap)}`);

    return Promise.all(
      weblinkList.map(async (item) => {
        if (item.selections?.length > 0) {
          const url = item.metadata.source;
          if (!weblinkIdMap.has(url)) return;

          return this.prisma.weblinkUserMark.createMany({
            data: item.selections.map((selector) => ({
              userId,
              weblinkId: weblinkIdMap.get(url),
              linkHost: new URL(url).hostname,
              selector: selector.xPath,
              markType: '',
              extensionVersion,
            })),
          });
        }
      }),
    );
  }

  /**
   * Process weblink for a single user.
   * @param link link data
   * @returns
   */
  async processLinkForUser(link: WebLinkDTO, weblink: Weblink) {
    if (!link.userId) {
      this.logger.log(`drop job due to missing user id: ${link}`);
      return;
    }

    // 更新访问记录
    const uwb = await this.prisma.userWeblink.upsert({
      where: {
        userId_url: {
          userId: link.userId,
          url: link.url,
        },
      },
      create: {
        url: link.url,
        weblinkId: weblink.id,
        origin: link.origin,
        userId: link.userId,
        originPageUrl: link.originPageUrl,
        originPageTitle: link.originPageTitle,
        originPageDescription: link.originPageDescription,
        lastVisitTime: !!link.lastVisitTime
          ? new Date(link.lastVisitTime)
          : new Date(),
        visitTimes: link.visitCount || 1,
        totalReadTime: link.readTime || 0,
      },
      update: {
        lastVisitTime: !!link.lastVisitTime
          ? new Date(link.lastVisitTime)
          : new Date(),
        visitTimes: { increment: link.visitCount || 1 },
        totalReadTime: { increment: link.readTime || 0 },
      },
    });
    this.logger.log(`process link for user finish`);

    return uwb;
  }

  async processLinkFromStoreQueue(link: WebLinkDTO) {
    this.logger.log(`process link from queue: ${JSON.stringify(link)}`);

    // TODO: 并发控制，妥善处理多个并发请求处理同一个 url 的情况

    // TODO: 处理 link 内容过时
    let weblink = await this.prisma.weblink.findUnique({
      where: { url: link.url },
    });

    // Link not found
    if (!weblink) {
      if (!link.storageKey) {
        return this.logger.warn(
          `storageKey not provided for ${link.url}, skip`,
        );
      }

      weblink = await this.createNewLink(link, {
        title: link.title,
        source: link.url,
      });
    }

    // Fetch doc and store in cache for later use
    const doc = link.storageKey
      ? await this.downloadWebLinkContent(link.url, link.storageKey)
      : await this.parseWebLinkContent(link.url);

    this.cache.set(link.url, JSON.stringify(doc));

    // TODO: 优化 page content 的清洗逻辑
    const $ = cheerio.load(doc.pageContent);
    doc.pageContent = $.text();

    // 处理单个用户的访问记录
    const uwb = await this.processLinkForUser(link, weblink);

    await this.aigcService.runContentFlow({ doc, link, uwb, weblink });
  }
}

function stripURL(url: string) {
  const urlObj = new URL(url);
  urlObj.hash = '';
  return urlObj.toString();
}
