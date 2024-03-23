import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Document } from '@langchain/core/documents';
import { CheerioWebBaseLoader } from 'langchain/document_loaders/web/cheerio';

import { PrismaService } from '../common/prisma.service';
import { WebLinkDTO } from './dto';
import { getExpectedTokenLenContent } from '../utils/token';
import { LlmService } from '../llm/llm.service';
import { Source } from '../types/weblink';

@Injectable()
export class WeblinkService {
  private readonly logger = new Logger(WeblinkService.name);

  constructor(
    private prisma: PrismaService,
    private llmService: LlmService,
    @InjectQueue('index') private indexQueue: Queue<WebLinkDTO>,
  ) {}

  async storeLinks(userId: string, links: WebLinkDTO[]) {
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
    linkMap.forEach((link) => this.indexQueue.add('indexWebLink', link));
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
      const loader = new CheerioWebBaseLoader(url);

      // customized webpage loading
      const $ = await loader.scrape();
      const pageContent = $(loader.selector).text();
      const title = $('title').text();
      const source = loader.webPath;

      return { pageContent, metadata: { title, source } };
    } catch (err) {
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
  async processLinkForUser(link: WebLinkDTO) {
    if (!link.userId) {
      this.logger.warn(`drop job due to missing user id: ${link}`);
      return;
    }

    const uwb = await this.prisma.userWeblink.upsert({
      where: {
        userId_url: {
          userId: link.userId,
          url: link.url,
        },
      },
      create: {
        ...link,
        userId: link.userId,
        lastVisitTime: new Date(link.lastVisitTime),
        visitTimes: link.visitCount,
        totalReadTime: link.readTime,
      },
      update: {
        lastVisitTime: new Date(link.lastVisitTime),
        visitTimes: { increment: link.visitCount },
        totalReadTime: { increment: link.readTime },
        updatedAt: new Date(),
      },
    });

    this.logger.log(`user weblink upserted: ${JSON.stringify(uwb)}`);
  }

  /**
   * Process weblink globally, including metadata extraction, indexing pipeline, etc.
   * @param link link data
   * @returns
   */
  async processLinkForGlobal(link: WebLinkDTO) {
    // TODO: Check global redis lock

    // Check if this link is already processed
    // TODO: handle stale weblink processed too long ago
    const wl = await this.prisma.weblink.findUnique({
      where: { url: link.url },
    });
    if (wl) {
      this.logger.log(`weblink already processed: ${link.url}`);
      return;
    }

    // Do real processing
    const doc = await this.parseWebLinkContent(link.url); // 处理错误边界

    // 提取元数据
    const contentMeta = await this.llmService.extractContentMeta(doc);
    await this.prisma.weblink.create({
      data: {
        url: link.url,
        meta: JSON.stringify(contentMeta),
        indexStatus: 'processing',
      },
    });

    // TODO: 策略选择与匹配，暂时用固定的策略

    // Apply strategy and save aigc content
    const content = await this.llmService.applyStrategy(doc);
    await this.prisma.aIGCContent.create({
      data: {
        title: content.title,
        content: content.content,
        sources: content.sources,
        meta: content.meta,
      },
    });

    if (contentMeta.needIndex()) {
      await this.llmService.indexPipelineFromLink(doc);
    }

    this.logger.log(`finish process link: ${link.url}`);

    await this.prisma.weblink.update({
      where: { url: link.url },
      data: { indexStatus: 'finish' },
    });
  }
}

function stripURL(url: string) {
  const urlObj = new URL(url);
  urlObj.hash = '';
  return urlObj.toString();
}
