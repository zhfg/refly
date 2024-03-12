import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { CreateConversationParam } from './dto';
import { randomUUID } from 'crypto';
import { MessageType, Prisma, ChatMessage } from '@prisma/client';
import {
  QUICK_ACTION_TASK_PAYLOAD,
  QUICK_ACTION_TYPE,
  Task,
} from 'src/types/task';
import { createLLMChatMessage } from 'src/llm/schema';
import { LlmService } from '../llm/llm.service';
import { Response } from 'express';

@Injectable()
export class ConversationService {
  constructor(private prisma: PrismaService, private llmService: LlmService) {}

  async create(param: CreateConversationParam, userId: string) {
    return this.prisma.conversation.create({
      data: {
        title: param.title,
        origin: param.origin,
        originPageUrl: param.originPageUrl,
        originPageTitle: param.originPageTitle,
        userId,
      },
    });
  }

  async updateConversation(
    conversationId: string,
    data: Prisma.ConversationUpdateInput,
  ) {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data,
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
    return this.prisma.conversation.findMany({
      ...params,
    });
  }

  async getMessages(conversationId: string) {
    return this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async handleChatTask(
    req: any,
    res: Response,
    task: Task,
    chatHistory: ChatMessage[],
  ) {
    const userId: string = req.user?.id;

    const filter: any = {
      must: [
        {
          key: 'userId',
          match: { value: userId },
        },
      ],
    };
    if (task?.data?.filter.weblinkList?.length > 0) {
      filter.must.push({
        key: 'source',
        match: { any: task?.data?.filter.weblinkList },
      });
    }

    const query = task?.data?.question;
    const { stream, sources } = await this.llmService.chat(
      query,
      chatHistory
        ? chatHistory.map((msg) => createLLMChatMessage(msg.content, msg.type))
        : [],
      filter,
    );

    // first return sources，use unique tag for parse data
    sources.forEach((source) => {
      const payload = {
        type: 'source',
        body: source,
      };
      res.write(`refly-sse-source: ${JSON.stringify(payload)}`);
    });

    // write answer in a stream style
    let answerStr = '';
    for await (const chunk of await stream) {
      answerStr += chunk;

      const payload = {
        type: 'chunk',
        body: chunk,
      };
      res.write(`refly-sse-data: ${JSON.stringify(payload)}`);
    }

    return {
      sources,
      answer: answerStr,
    };
  }

  async handleQuickActionTask(
    req: any,
    res: Response,
    task: Task,
    chatHistory: ChatMessage[],
  ) {
    const data = task?.data as QUICK_ACTION_TASK_PAYLOAD;

    // first return sources，use unique tag for parse data
    // frontend return origin weblink meta
    const sources = data?.filter?.weblinkList || [];
    // TODO: 这里后续要处理边界情况，比如没有链接时应该报错
    if (sources?.length <= 0) {
      return {
        sources: [],
        answer: '',
      };
    }

    sources.forEach((source) => {
      const payload = {
        type: 'source',
        body: source,
      };
      res.write(`refly-sse-source: ${JSON.stringify(payload)}`);
    });

    // write answer in a stream style
    let answerStr = '';
    // 这里用于回调
    const onMessage = (chunk: string) => {
      answerStr += chunk;

      const payload = {
        type: 'chunk',
        body: chunk,
      };
      res.write(`refly-sse-data: ${JSON.stringify(payload)}`);
    };

    switch (data?.actionType) {
      case QUICK_ACTION_TYPE.SUMMARY:
        await this.llmService.summary(
          data?.actionPrompt,
          data?.filter?.weblinkList,
          chatHistory,
          onMessage,
        );
        break;

      default:
        break;
    }

    return {
      sources,
      answer: answerStr,
    };
  }
}
