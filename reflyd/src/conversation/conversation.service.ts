import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { CreateConversationParam } from './dto';
import { randomUUID } from 'crypto';
import { MessageSource, Prisma } from '@prisma/client';

@Injectable()
export class ConversationService {
  constructor(private prisma: PrismaService) {}

  async create(param: CreateConversationParam, userId: string) {
    return this.prisma.conversation.create({
      data: {
        title: param.title,
        conversationId: randomUUID(),
        userId,
      },
    });
  }

  async addChatMessage(msg: {
    source: MessageSource;
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
