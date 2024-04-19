import { Injectable } from '@nestjs/common';
import { Response } from 'express';

import { PrismaService } from '../common/prisma.service';
import { CreateConversationParam } from './dto';
import { MessageType, Prisma, ChatMessage } from '@prisma/client';
import {
  QUICK_ACTION_TASK_PAYLOAD,
  QUICK_ACTION_TYPE,
  Task,
  TaskResponse,
} from '../types/task';
import { createLLMChatMessage } from '../llm/schema';
import { LlmService } from '../llm/llm.service';
import { WeblinkService } from '../weblink/weblink.service';
import { LoggerService } from '../common/logger.service';
import { IterableReadableStream } from '@langchain/core/dist/utils/stream';
import { BaseMessageChunk } from 'langchain/schema';

const LLM_SPLIT = '__LLM_RESPONSE__';
const RELATED_SPLIT = '__RELATED_QUESTIONS__';

@Injectable()
export class ConversationService {
  constructor(
    private logger: LoggerService,
    private prisma: PrismaService,
    private weblinkService: WeblinkService,
    private llmService: LlmService,
  ) {
    this.logger.setContext(ConversationService.name);
  }

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
    relatedQuestions?: string;
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
  ): Promise<TaskResponse> {
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

    // 如果有 cssSelector，则代表从基于选中的内容进行提问，否则根据上下文进行相似度匹配召回
    const chatFromClientSelector = task?.data?.filter?.weblinkList?.find(
      (item) => item?.selections?.length > 0,
    );

    // 前置的数据处理
    const query = task?.data?.question;
    const llmChatMessages = chatHistory
      ? chatHistory.map((msg) => createLLMChatMessage(msg.content, msg.type))
      : [];
    // 如果是基于选中内容提问的话，则不需要考虑上下文
    const questionWithContext =
      chatHistory.length === 0 || chatFromClientSelector
        ? query
        : await this.llmService.getContextualQuestion(query, llmChatMessages);

    const sources = chatFromClientSelector
      ? await this.weblinkService.parseMultiWeblinks(
          task?.data?.filter?.weblinkList,
        )
      : await this.llmService.getRetrievalDocs(questionWithContext, filter);

    const { stream } = await this.llmService.chat(
      questionWithContext,
      llmChatMessages,
      sources,
    );

    // first return sources，use unique tag for parse data
    res.write(JSON.stringify(sources));
    res.write(LLM_SPLIT);

    const getSSEData = async (stream) => {
      // write answer in a stream style
      let answerStr = '';
      for await (const chunk of await stream) {
        answerStr += chunk;

        res.write(chunk);
      }

      return answerStr;
    };

    const [answerStr, relatedQuestions] = await Promise.all([
      getSSEData(stream),
      this.llmService.getRelatedQuestion(sources, questionWithContext),
    ]);

    this.logger.log('relatedQuestions', relatedQuestions);

    res.write(RELATED_SPLIT);
    res.write(JSON.stringify(relatedQuestions));

    return {
      sources,
      answer: answerStr,
      relatedQuestions,
    };
  }

  async handleSearchEnhanceTask(
    req: any,
    res: Response,
    task: Task,
    chatHistory: ChatMessage[],
  ): Promise<TaskResponse> {
    const query = task?.data?.question;
    const { stream, sources } = await this.llmService.searchEnhance(
      query,
      chatHistory
        ? chatHistory.map((msg) => createLLMChatMessage(msg.content, msg.type))
        : [],
    );

    // first return sources，use unique tag for parse data
    res.write(JSON.stringify(sources));
    res.write(LLM_SPLIT);

    const getSSEData = async (stream) => {
      // write answer in a stream style
      let answerStr = '';
      for await (const chunk of await stream) {
        const chunkStr =
          chunk?.content || (typeof chunk === 'string' ? chunk : '');
        answerStr += chunkStr;

        res.write(chunkStr);
      }

      return answerStr;
    };

    const [answerStr, relatedQuestions] = await Promise.all([
      getSSEData(stream),
      this.llmService.getRelatedQuestion(sources, query),
    ]);

    this.logger.log('relatedQuestions', relatedQuestions);

    res.write(RELATED_SPLIT);
    res.write(JSON.stringify(relatedQuestions));

    const handledAnswer = answerStr
      .replace(/\[\[([cC])itation/g, '[citation')
      .replace(/[cC]itation:(\d+)]]/g, 'citation:$1]')
      .replace(/\[\[([cC]itation:\d+)]](?!])/g, `[$1]`)
      .replace(/\[[cC]itation:(\d+)]/g, '[citation]($1)');
    this.logger.log('handledAnswer', handledAnswer);

    return {
      sources,
      // 支持做 citation 的处理
      answer: handledAnswer,
      relatedQuestions,
    };
  }

  async handleQuickActionTask(
    req: any,
    res: Response,
    task: Task,
    chatHistory: ChatMessage[],
  ): Promise<TaskResponse> {
    const data = task?.data as QUICK_ACTION_TASK_PAYLOAD;

    // first return sources，use unique tag for parse data
    // frontend return origin weblink meta
    const sources = data?.filter?.weblinkList || [];
    // TODO: 这里后续要处理边界情况，比如没有链接时应该报错
    if (sources?.length <= 0) {
      res.write(JSON.stringify([]));
      // 先发一个空块，提前展示 sources
      res.write(LLM_SPLIT);

      return {
        sources: [],
        answer: '',
      };
    }

    res.write(JSON.stringify(sources));
    res.write(LLM_SPLIT);

    const weblinkList = data?.filter?.weblinkList;
    if (weblinkList?.length <= 0) return;

    // save user mark for each weblink in a non-blocking style
    this.weblinkService.saveWeblinkUserMarks({
      userId: req.user.id,
      weblinkList,
      extensionVersion: req.header('x-refly-ext-version'),
    });

    // 基于一组网页做总结，先获取网页内容
    const docs = await this.weblinkService.parseMultiWeblinks(weblinkList);

    let stream: IterableReadableStream<BaseMessageChunk>;
    if (data?.actionType === QUICK_ACTION_TYPE.SUMMARY) {
      const weblinkList = data?.filter?.weblinkList;
      if (weblinkList?.length <= 0) return;

      stream = await this.llmService.summary(data?.actionPrompt, docs);
    }

    const getSSEData = async (stream) => {
      // write answer in a stream style
      let answerStr = '';
      for await (const chunk of await stream) {
        const chunkStr =
          chunk?.content || (typeof chunk === 'string' ? chunk : '');
        answerStr += chunkStr;

        res.write(chunkStr);
      }

      return answerStr;
    };

    const getUserQuestion = (actionType: QUICK_ACTION_TYPE) => {
      switch (actionType) {
        case QUICK_ACTION_TYPE.SUMMARY: {
          return '总结网页';
        }
      }
    };

    const [answerStr, relatedQuestions] = await Promise.all([
      getSSEData(stream),
      this.llmService.getRelatedQuestion(
        docs,
        getUserQuestion(data?.actionType),
      ),
    ]);

    this.logger.log('relatedQuestions', relatedQuestions);

    res.write(RELATED_SPLIT);
    res.write(JSON.stringify(relatedQuestions));

    return {
      sources,
      answer: answerStr,
      relatedQuestions,
    };
  }
}
