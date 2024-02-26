import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { CreateConversationParam } from './dto';
import { randomUUID } from 'crypto';
import { MessageType, Prisma } from '@prisma/client';

@Injectable()
export class ConversationService {
  constructor(private prisma: PrismaService) {}

  async create(param: CreateConversationParam, userId: string) {
    return this.prisma.conversation.create({
      data: {
        title: param.title,
        origin: param.origin,
        originPageUrl: param.originPageUrl,
        originPageTitle: param.originPageTitle,
        conversationId: param?.conversationId || randomUUID(),
        userId,
      },
    });
  }

  async addChatMessage(msg: {
    type: MessageType;
    sources: string;
    content: string;
    userId: string;
    conversationId: string;
  }) {
    return this.prisma.chatMessage.create({
      data: { ...msg, messageId: randomUUID() },
    });
  }

  async findFirstConversation(params: {
    where: Prisma.ConversationWhereInput;
  }) {
    return this.prisma.conversation.findFirst(params);
  }

  async getConversations(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ConversationWhereUniqueInput;
    where?: Prisma.ConversationWhereInput;
    orderBy?: Prisma.ConversationOrderByWithRelationInput;
  }) {
    return this.prisma.conversation.findMany(params);
  }

  async getMessages(conversationId: string) {
    return this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
