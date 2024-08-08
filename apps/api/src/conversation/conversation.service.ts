import { Injectable, Logger } from '@nestjs/common';

import { Prisma, Conversation } from '@prisma/client';
import { CreateConversationRequest, User } from '@refly/openapi-schema';

import { PrismaService } from '@/common/prisma.service';
import { CreateChatMessageInput } from './conversation.dto';
import { genChatMessageID, genConvID } from '@refly/utils';

@Injectable()
export class ConversationService {
  private logger = new Logger(ConversationService.name);

  constructor(private prisma: PrismaService) {}

  async upsertConversation(
    user: User,
    param: CreateConversationRequest,
    convId?: string,
  ): Promise<Conversation> {
    const upsertParam = {
      convId: convId || genConvID(),
      title: param.title,
      origin: param.origin,
      originPageUrl: param.originPageUrl,
      originPageTitle: param.originPageTitle,
      uid: user.uid,
    };
    if (convId) {
      return this.prisma.conversation.upsert({
        where: { convId },
        create: upsertParam,
        update: {},
      });
    }
    return this.prisma.conversation.create({
      data: upsertParam,
    });
  }

  /**
   * Add chat messages to a conversation.
   * If conversation id (primary key) is not provided, a new one will be created.
   * lastMessage and messageCount will be updated automatically.
   * @param msgList chat messages
   * @param conv existing conversation or new conversation
   */
  async addChatMessages(
    msgList: CreateChatMessageInput[],
    convParam: Prisma.ConversationCreateInput,
  ) {
    if (msgList.length === 0) {
      return;
    }

    const { convId } = convParam;
    if (!convId) {
      this.logger.warn('No convId provided, skip add messages');
      return;
    }

    // Create new conversation if pk is not provided
    msgList.forEach((msg) => {
      msg.convId = convId;
    });

    return this.prisma.$transaction([
      this.prisma.chatMessage.createMany({
        data: msgList.map((msg) => ({ ...msg, msgId: genChatMessageID() })),
      }),
      this.prisma.conversation.upsert({
        where: { convId },
        create: {
          ...convParam,
          lastMessage: msgList[msgList.length - 1].content,
          messageCount: msgList.length,
        },
        update: {
          lastMessage: msgList[msgList.length - 1].content,
          messageCount: { increment: msgList.length },
        },
      }),
    ]);
  }

  async getConversationDetail(user: User, convId: string) {
    const [conversation, messages] = await Promise.all([
      this.prisma.conversation.findFirst({
        where: { convId, uid: user.uid },
      }),
      this.prisma.chatMessage.findMany({
        where: { convId, uid: user.uid },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return { ...conversation, messages };
  }

  async getConversations(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ConversationWhereUniqueInput;
    where?: Prisma.ConversationWhereInput;
    orderBy?: Prisma.ConversationOrderByWithRelationInput;
  }) {
    return this.prisma.conversation.findMany({
      ...params,
    });
  }
}
