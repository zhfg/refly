import { Injectable } from '@nestjs/common';
import { Response } from 'express';

import { PrismaService } from '../common/prisma.service';
import { CreateConversationParam } from './dto';
import { MessageType, Prisma, ChatMessage } from '@prisma/client';
import {
  QUICK_ACTION_TASK_PAYLOAD,
  QUICK_ACTION_TYPE,
  Task,
} from 'src/types/task';
import { createLLMChatMessage } from 'src/llm/schema';
import { LlmService } from '../llm/llm.service';
import { WeblinkService } from 'src/weblink/weblink.service';

@Injectable()
export class ConversationService {
  constructor(
    private prisma: PrismaService,
    private weblinkService: WeblinkService,
    private llmService: LlmService,
  ) {}

  async create(param: CreateConversationParam, userId: number) {
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
    conversationId: number,
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
    userId: number;
    conversationId: number;
    selectedWeblinkConfig?: string;
  }) {
    return this.prisma.chatMessage.create({
      data: { ...msg },
    });
  }

  async addChatMessages(
    msgList: {
      type: MessageType;
      sources: string;
      content: string;
      userId: number;
      conversationId: number;
      selectedWeblinkConfig?: string;
    }[],
  ) {
    return this.prisma.chatMessage.createMany({
      data: msgList,
    });
  }

  async findConversationAndMessages(conversationId: number) {
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: true },
    });
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

  async getMessages(conversationId: number) {
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
    const userId: number = req.user?.id;

    const filter: any = {
      must: [
        {
          key: 'userId',
          match: { value: userId },
        },
      ],
    };
    if (task?.data?.filter?.weblinkList?.length > 0) {
      filter.must.push({
        key: 'source',
        match: {
          any: task?.data?.filter?.weblinkList?.map(
            (item) => item?.metadata?.source,
          ),
        },
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

    // 先发一个空块，提前展示 sources
    res.write(`refly-sse-source: [REFLY-SOURCE-END]`);

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
      res.write(`refly-sse-source: ${JSON.stringify({})}`);

      // 先发一个空块，提前展示 sources
      res.write(`refly-sse-source: [REFLY-SOURCE-END]`);

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

    // 先发一个空块，提前展示 sources
    res.write(`refly-sse-source: [REFLY-SOURCE-END]`);

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

    if (data?.actionType === QUICK_ACTION_TYPE.SUMMARY) {
      const weblinkList = data?.filter?.weblinkList;
      if (weblinkList?.length <= 0) return;

      // 基于一组网页做总结，先获取网页内容
      const docs = await this.weblinkService.parseMultiWeblinks(weblinkList);

      await this.llmService.summary(
        data?.actionPrompt,
        docs,
        chatHistory,
        onMessage,
      );
    }

    return {
      sources,
      answer: answerStr,
    };
  }
}
