import { Logger, Injectable } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { omit } from 'lodash';

import { LlmService } from '../llm/llm.service';
import { PrismaService } from '../common/prisma.service';
import { AigcContent, User, UserWeblink, Weblink } from '@prisma/client';
import { ContentMeta } from '../llm/dto';
import { DigestFilter } from './aigc.dto';
import { categoryList } from '../prompts/utils/category';
import { PageMeta } from '../types/weblink';

@Injectable()
export class AigcService {
  private logger = new Logger(AigcService.name);

  constructor(private prisma: PrismaService, private llmService: LlmService) {}

  async getDigestList(params: {
    userId: string;
    page?: number;
    pageSize?: number;
    filter: DigestFilter;
  }) {
    const { userId, page = 1, pageSize = 10, filter } = params;
    const cond: any = { userId };
    if (filter?.date) {
      const { year, month, day } = filter.date;
      cond.date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    if (filter?.topic) {
      cond.topicKey = filter.topic;
    }
    return this.prisma.userDigest.findMany({
      where: cond,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { content: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async fetchDigestWeblinks(content: AigcContent) {
    const results = await this.prisma.aigcContent.findMany({
      select: {
        weblink: {
          select: { url: true, pageMeta: true, contentMeta: true },
        },
      },
      where: { id: { in: content.inputIds } },
    });
    return results.map((res) => res.weblink);
  }

  async getFeedList(params: { userId: string; page?: number; pageSize?: number }) {
    const { page = 1, pageSize = 10 } = params;
    return this.prisma.aigcContent.findMany({
      where: { sourceType: 'weblink' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        weblink: { select: { url: true, pageMeta: true, contentMeta: true } },
      },
    });
  }

  async getContent(params: { contentId: number }) {
    const { contentId } = params;
    const content = await this.prisma.aigcContent.findUnique({
      where: { id: contentId },
    });

    let inputs: AigcContent[];
    if (content.inputIds.length > 0) {
      inputs = await this.prisma.aigcContent.findMany({
        where: { id: { in: content.inputIds } },
      });
    }
    return { ...content, inputs };
  }

  async updateUserPreferences(param: { uwb: UserWeblink; meta: ContentMeta }) {
    const { uwb, meta } = param;

    // 对于每一个标注的 topic，更新用户喜好
    return Promise.all(
      meta.topics.map(async (topic) => {
        await this.prisma.userPreference.upsert({
          where: {
            userId_topicKey: {
              userId: uwb.userId,
              topicKey: topic.key,
            },
          },
          create: {
            userId: uwb.userId,
            topicKey: topic.key,
            score: topic.score,
          },
          update: {
            score: { increment: topic.score }, // TODO: 迭代兴趣分数策略,例如权重、衰减等
          },
        });
      }),
    );
  }

  /**
   * 更新用户 digest
   * TODO: 目前认为一个 link 只包含一个 topic，所以直接取第一个 digest
   * @param param
   * @returns
   */
  async upsertUserDigest(param: {
    uwb: UserWeblink;
    content: AigcContent;
    meta: ContentMeta;
  }): Promise<void> {
    const { uwb, content, meta } = param;
    const { userId } = uwb;

    const today = new Date().toISOString().split('T')[0];

    // 创建新的 digest 内容及其对应的记录
    this.prisma.$transaction(async (tx) => {
      const newDigest = await tx.userDigest.create({
        data: {
          userId,
          date: today,
          topicKey: meta.topics[0].key,
          content: {
            create: {
              ...omit(content, 'id', 'sources'),
              sourceType: 'digest',
              inputIds: [content.id],
            } as AigcContent,
          },
        },
      });
      await tx.aigcContent.update({
        where: { id: content.id },
        data: { outputIds: { push: newDigest.contentId } },
      });
    });
  }

  /**
   * 处理用户内容流程: 先更新用户偏好画像，再更新 digest
   * @param uwb 用户访问记录
   * @returns
   */
  async runUserContentFlow(param: { uwb: UserWeblink; meta: ContentMeta; content: AigcContent }) {
    const { uwb, meta } = param;
    const user = await this.prisma.user.findUnique({
      where: { id: uwb.userId },
    });
    if (!user) {
      return;
    }

    // 更新用户偏好
    await this.updateUserPreferences({ ...param, meta });
    // 更新用户摘要
    await this.upsertUserDigest({ ...param, meta });
  }

  // TODO: need add locale
  private async applyContentStrategy(param: {
    user: User;
    weblink: Weblink;
    doc: Document;
    meta: ContentMeta;
  }) {
    const { weblink, doc, meta } = param;

    // 查找该 weblink 是否已生成内容，如有则直接返回
    const content = await this.prisma.aigcContent.findFirst({
      where: { weblinkId: weblink.id },
    });
    if (content) {
      this.logger.log(`found existing content for source type weblink: ${weblink.id}`);
      return content;
    }

    // TODO: 策略选择与匹配，暂时用固定的策略
    this.logger.log(`picking matched strategy with meta: ${JSON.stringify(meta)}`);

    // Apply strategy and save aigc content
    const newContent = await this.llmService.applyStrategy(doc);
    return await this.prisma.aigcContent.create({
      data: {
        ...newContent,
        sourceType: 'weblink',
        weblinkId: weblink.id,
      } as AigcContent,
    });
  }

  /**
   * 处理全局内容流程: 应用内容策略，分发 feed
   * @param doc
   * @returns
   */
  async runContentFlow(param: { doc: Document<PageMeta>; uwb: UserWeblink; weblink: Weblink }) {
    const { doc, uwb, weblink } = param;
    const meta = JSON.parse(weblink.contentMeta || '{}');

    if (!meta.topics) {
      this.logger.log(`weblink ${weblink.url} has no topic, skip content flow`);
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: uwb.userId },
    });
    if (!user) {
      this.logger.log(`weblink ${weblink.url} has no user, skip content flow`);
      return;
    }

    // 新的 weblink，运行内容策略和 feed 分发
    const content = await this.applyContentStrategy({
      ...param,
      doc,
      meta,
      user,
    });

    await this.runUserContentFlow({ ...param, meta, content });
  }

  async findTopicByKey(key: string) {
    return this.prisma.topic.findUnique({
      where: { key },
    });
  }

  async ensureTopics(meta: ContentMeta) {
    const topicKeys = meta.topics.map((topic) => topic.key);
    const existingTopics = await this.prisma.topic.findMany({
      where: { key: { in: topicKeys } },
    });
    const existingTopicKeys = existingTopics.map((topic) => topic.key);
    const newTopicKeys = topicKeys.filter((element) => !existingTopicKeys.includes(element));

    if (newTopicKeys.length > 0) {
      const categoryMap = new Map(categoryList.map((c) => [c.id, c]));
      await this.prisma.topic.createMany({
        data: newTopicKeys.map((topic) => ({
          key: topic,
          name: categoryMap.get(topic).name,
          description: categoryMap.get(topic).description,
        })),
      });
    }
  }
}
