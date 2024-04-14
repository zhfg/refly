import { Injectable, Logger } from '@nestjs/common';
import { Prisma, Weblink } from '@prisma/client';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Document } from '@langchain/core/documents';
import { CheerioWebBaseLoader } from 'langchain/document_loaders/web/cheerio';

import { LoggerService } from '../common/logger.service';
import { PrismaService } from '../common/prisma.service';
import { AigcService } from '../aigc/aigc.service';
import { WebLinkDTO } from './dto';
import { getExpectedTokenLenContent } from '../utils/token';
import { Source } from '../types/weblink';
import { QUEUE_STORE_LINK } from '../utils/const';

@Injectable()
export class WeblinkService {
  constructor(
    private logger: LoggerService,
    private prisma: PrismaService,
    private aigcService: AigcService,
    @InjectQueue(QUEUE_STORE_LINK) private indexQueue: Queue<WebLinkDTO>,
  ) {
    this.logger.setContext(WeblinkService.name);
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
    linkMap.forEach((link) => this.processLinkFromStoreQueue(link));
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

  async parseWebLinkContent(url: string): Promise<Document> {
    try {
      const loader = new CheerioWebBaseLoader(url, {
        maxRetries: 3,
        timeout: 5000,
      });

      // customized webpage loading
      const $ = await loader.scrape();
      // remove all styles and scripts tag
      $('script, style').remove();
      // only get meaning content
      const pageContent = $(loader.selector).text();
      const title = $('title').text();
      const source = loader.webPath;

      return { pageContent, metadata: { title, source } };
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

    return Promise.all(
      weblinkList.map(async (item) => {
        const { pageContent, metadata } = await this.parseWebLinkContent(
          item?.metadata?.source,
        );
        const truncateStr =
          getExpectedTokenLenContent(pageContent, avgTokenLen) || '';

        return {
          pageContent: truncateStr,
          metadata,
        };
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
        lastVisitTime: new Date(link.lastVisitTime),
        visitTimes: link.visitCount,
        totalReadTime: link.readTime,
      },
      update: {
        lastVisitTime: new Date(link.lastVisitTime),
        visitTimes: { increment: link.visitCount },
        totalReadTime: { increment: link.readTime || 0 },
        updatedAt: new Date(),
      },
    });

    return uwb;
  }

  async processLinkFromStoreQueue(link: WebLinkDTO) {
    this.logger.log(`process link from queue: ${JSON.stringify(link)}`);

    // TODO: 并发控制，妥善处理多个并发请求处理同一个 url 的情况

    // TODO: 处理 link 内容过时
    let weblink = await this.prisma.weblink.findUnique({
      where: { url: link.url },
    });

    // 未处理过此链接
    if (!weblink) {
      const doc = await this.parseWebLinkContent(link.url);
      if (doc) {
        weblink = await this.prisma.weblink.create({
          data: {
            url: link.url,
            indexStatus: 'processing',
            pageContent: doc.pageContent,
            pageMeta: JSON.stringify(doc.metadata),
            contentMeta: '',
          },
        });
      }
    }

    if (!weblink) {
      this.logger.log(`weblink is still empty, skip`);
      return;
    }

    // 处理单个用户的访问记录
    const uwb = await this.processLinkForUser(link, weblink);

    await this.aigcService.runContentFlow({ link, uwb, weblink });
  }
}

function stripURL(url: string) {
  const urlObj = new URL(url);
  urlObj.hash = '';
  return urlObj.toString();
}
