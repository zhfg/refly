import { Injectable, Logger } from '@nestjs/common';
import { Document } from '@langchain/core/documents';

import { LlmService } from '../llm/llm.service';
import { PrismaService } from '../common/prisma.service';
import { AIGCContent, UserWeblink, Weblink } from '@prisma/client';
import { ContentMeta } from 'src/llm/dto';
import { WebLinkDTO } from 'src/weblink/dto';

@Injectable()
export class AigcService {
  private readonly logger = new Logger(AigcService.name);

  constructor(private prisma: PrismaService, private llmService: LlmService) {}

  private async updateUserPreferences(param: {
    uwb: UserWeblink;
    meta: ContentMeta;
  }) {
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
  private async upsertUserDigest(param: {
    uwb: UserWeblink;
    content: AIGCContent;
    meta: ContentMeta;
  }): Promise<void> {
    const { uwb, content, meta } = param;
    const { userId } = uwb;

    const today = new Date().toISOString().split('T')[0];
    const digest = await this.prisma.userDigest.findUnique({
      where: {
        userId_date_topicKey: {
          userId,
          date: today,
          topicKey: meta.topics[0].key,
        },
      },
      include: { content: true },
    });

    const newDoc = new Document({
      pageContent: content.content,
    });

    // 如果该 topic 下已有内容，进行增量总结
    if (digest) {
      // 如果该 digest 已包含指定 weblink，则不做任何增量总结
      if (digest.weblinkIds.includes(uwb.weblinkId)) {
        this.logger.log(
          `digest ${digest.id} already contains weblink ${uwb.weblinkId}`,
        );
        return;
      }

      const oldDoc = new Document({
        pageContent: digest.content.content,
      });

      const combinedDigest = await this.llmService.incrementalSummary(
        oldDoc,
        newDoc,
      );
      await this.prisma.aIGCContent.update({
        where: { id: digest.content.id },
        data: { ...combinedDigest },
      });
      await this.prisma.userDigest.update({
        where: { id: digest.id },
        data: { weblinkIds: { push: uwb.weblinkId } },
      });
      return;
    }

    // 创建新的 digest 内容及其对应的记录
    await this.prisma.userDigest.create({
      data: {
        userId,
        date: today,
        topicKey: meta.topics[0].key,
        weblinkIds: [uwb.weblinkId],
        content: {
          create: {
            ...(await this.llmService.incrementalSummary(null, newDoc)),
            sourceType: 'digest',
          } as AIGCContent,
        },
      },
    });
  }

  /**
   * 处理用户内容流程: 先更新用户偏好画像，再更新 digest
   * @param uwb 用户访问记录
   * @returns
   */
  async runUserContentFlow(param: {
    uwb: UserWeblink;
    meta: ContentMeta;
    content: AIGCContent;
  }) {
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

  private async applyContentStrategy(param: {
    weblink: Weblink;
    doc: Document;
    meta: ContentMeta;
  }) {
    const { weblink, doc, meta } = param;

    // 查找该 weblink 是否已生成内容，如有则直接返回
    const content = await this.prisma.aIGCContent.findFirst({
      where: { weblinkId: weblink.id },
    });
    if (content) {
      this.logger.log(
        `found existing content for source type weblink: ${weblink.id}`,
      );
      return content;
    }

    // TODO: 策略选择与匹配，暂时用固定的策略
    this.logger.log(
      `picking matched strategy with meta: ${JSON.stringify(meta)}`,
    );

    // Apply strategy and save aigc content
    const newContent = await this.llmService.applyStrategy(doc);
    return await this.prisma.aIGCContent.create({
      data: {
        ...newContent,
        sourceType: 'weblink',
        weblinkId: weblink.id,
      } as AIGCContent,
    });
  }

  // /**
  //  * Dispatch feed to target users.
  //  * @param content aigc content
  //  * @returns
  //  */
  // private async dispatchFeed(param: {
  //   weblink: Weblink;
  //   meta: ContentMeta;
  //   content: AIGCContent;
  // }) {
  //   const { weblink, meta, content } = param;

  //   // topic 管理先简单点，就用 key 去匹配
  //   // 介绍文案先前端写死
  //   // await this.ensureTopics(meta);

  //   // Find users related to this content
  //   const userIds = await this.prisma.userPreference.findMany({
  //     select: { userId: true },
  //     where: {
  //       topicKey: { in: meta.topics.map((t) => t.key) },
  //       score: { gte: 0 }, // TODO: 设计更合适的推荐门槛
  //     },
  //   });

  //   // Check if these users have read this source
  //   const readLinkUsers = await this.prisma.userWeblink.findMany({
  //     select: { userId: true },
  //     where: {
  //       url: weblink.url,
  //       userId: { in: userIds.map((u) => u.userId) },
  //     },
  //   });
  //   const readUserSet = new Set(readLinkUsers.map((elem) => elem.userId));
  //   const unreadUsers = userIds.filter((u) => !readUserSet.has(u.userId));

  //   // Add feed records for unread users
  //   if (unreadUsers.length > 0) {
  //     this.logger.log(`add feed ${content.id} to users: ${unreadUsers}`);
  //     await this.prisma.userFeed.createMany({
  //       data: unreadUsers.map((u) => ({
  //         userId: u.userId,
  //         contentId: content.id,
  //       })),
  //     });
  //   }
  // }

  /**
   * 处理全局内容流程: 应用内容策略，分发 feed
   * @param doc
   * @returns
   */
  async runContentFlow(param: {
    link: WebLinkDTO;
    uwb: UserWeblink;
    weblink: Weblink;
  }) {
    const { weblink } = param;
    let meta: ContentMeta;
    const doc = new Document({
      pageContent: weblink.pageContent,
      metadata: JSON.parse(weblink.pageMeta),
    });

    if (!weblink.contentMeta) {
      // 提取网页分类打标数据 with LLM
      meta = await this.llmService.extractContentMeta(doc);
      if (shouldRunIndexPipeline(meta)) {
        await this.llmService.indexPipelineFromLink(doc);
      }
      await this.prisma.weblink.update({
        where: { id: weblink.id },
        data: { contentMeta: JSON.stringify(meta), indexStatus: 'finish' },
      });
    } else {
      meta = JSON.parse(weblink.contentMeta);
    }

    if (!meta.topics) {
      this.logger.log(`weblink ${weblink.url} has no topic, skip content flow`);
      return;
    }

    // 新的 weblink，运行内容策略和 feed 分发
    const content = await this.applyContentStrategy({ ...param, doc, meta });
    // await this.dispatchFeed({ ...param, meta, content });

    await this.runUserContentFlow({ ...param, meta, content });
  }

  //   async ensureTopics(meta: ContentMeta) {
  //     const topicKeys = meta.topics.map((topic) => topic.key);
  //     const existingTopics = await this.prisma.topic.findMany({
  //       where: { key: { in: topicKeys } },
  //     });
  //     const existingTopicKeys = existingTopics.map((topic) => topic.key);
  //     const newTopicKeys = topicKeys.filter(
  //       (element) => !existingTopicKeys.includes(element),
  //     );

  //     if (newTopicKeys.length > 0) {
  //       await this.prisma.topic.createMany({
  //         data: newTopicKeys.map((topic) => ({
  //           key: topic,
  //           localeName: `关于${topic}的名称`,
  //           localeDescription: `关于${topic}的描述`,
  //         })),
  //       });
  //     }
  //   }
}

function shouldRunIndexPipeline(meta: ContentMeta): boolean {
  return false;
}
