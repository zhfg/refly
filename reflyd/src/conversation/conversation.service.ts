import { Injectable } from '@nestjs/common';
import { Response } from 'express';

import { PrismaService } from '../common/prisma.service';
import { CreateChatMessageInput, CreateConversationParam } from './dto';
import { Prisma, ChatMessage } from '@prisma/client';
import {
  LOCALE,
  QUICK_ACTION_TASK_PAYLOAD,
  QUICK_ACTION_TYPE,
  TASK_TYPE,
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
    messages: { type: string; content: string }[],
    data: Prisma.ConversationUpdateInput,
    locale: LOCALE,
  ) {
    const summarizedTitle = await this.llmService.summarizeConversation(
      messages,
      locale,
    );
    this.logger.log(`Summarized title: ${summarizedTitle}`);

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { ...data, title: summarizedTitle },
    });
  }

  async addChatMessages(msgList: CreateChatMessageInput[]) {
    return this.prisma.chatMessage.createMany({
      data: msgList,
    });
  }

  async findConversationAndMessages(conversationId: number) {
    const data = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: true },
    });

    data.messages.sort((a, b) => a.id - b.id);

    return data;
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

  async chat(res: Response, convId: number, userId: number, task: Task) {
    const { taskType, data = {} } = task;

    const query = data?.question || '';
    const weblinkList = data?.filter?.weblinkList || [];

    // 获取聊天历史
    const chatHistory = await this.getMessages(convId);

    let taskRes: TaskResponse;
    if (taskType === TASK_TYPE.QUICK_ACTION) {
      taskRes = await this.handleQuickActionTask(res, userId, task);
    } else if (taskType === TASK_TYPE.SEARCH_ENHANCE_ASK) {
      taskRes = await this.handleSearchEnhanceTask(res, task, chatHistory);
    } else {
      taskRes = await this.handleChatTask(res, userId, task, chatHistory);
    }
    res.end(``);

    const newMessages: CreateChatMessageInput[] = [
      {
        type: 'human',
        userId,
        conversationId: convId,
        content: query,
        sources: '',
        // 每次提问完在 human message 上加一个提问的 filter，这样之后追问时可以 follow 这个 filter 规则
        selectedWeblinkConfig: JSON.stringify({
          searchTarget: weblinkList?.length > 0 ? 'selectedPages' : 'all',
          filter: weblinkList,
        }),
      },
      {
        type: 'ai',
        userId,
        conversationId: convId,
        content: taskRes.answer,
        sources: JSON.stringify(taskRes.sources),
        relatedQuestions: JSON.stringify(taskRes.relatedQuestions),
      },
    ];

    // post chat logic
    await Promise.all([
      this.addChatMessages(newMessages),
      this.updateConversation(
        convId,
        [...chatHistory, ...newMessages],
        {
          lastMessage: taskRes.answer,
          messageCount: chatHistory.length + 2,
        },
        task?.locale,
      ),
    ]);
  }

  async handleChatTask(
    res: Response,
    userId: number,
    task: Task,
    chatHistory: ChatMessage[],
  ): Promise<TaskResponse> {
    const locale = task?.locale || LOCALE.EN;

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
      chatHistory.length === 1 || chatFromClientSelector
        ? query
        : await this.llmService.getContextualQuestion(
            query,
            locale,
            llmChatMessages,
          );

    const sources = chatFromClientSelector
      ? await this.weblinkService.parseMultiWeblinks(
          task?.data?.filter?.weblinkList,
        )
      : await this.llmService.getRetrievalDocs(questionWithContext, filter);

    const { stream } = await this.llmService.chat(
      questionWithContext,
      locale,
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
        answerStr += chunk || '';

        res.write(chunk || '');
      }

      return answerStr;
    };

    const [answerStr, relatedQuestions] = await Promise.all([
      getSSEData(stream),
      this.llmService.getRelatedQuestion(sources, questionWithContext, locale),
    ]);

    this.logger.log('relatedQuestions', relatedQuestions);

    res.write(RELATED_SPLIT);

    if (relatedQuestions) {
      res.write(JSON.stringify(relatedQuestions) || '');
    }

    return {
      sources,
      answer: answerStr,
      relatedQuestions,
    };
  }

  async handleSearchEnhanceTask(
    res: Response,
    task: Task,
    chatHistory: ChatMessage[],
  ): Promise<TaskResponse> {
    const query = task?.data?.question;
    const locale = task?.locale || LOCALE.EN;
    const { stream, sources } = await this.llmService.searchEnhance(
      query,
      locale,
      chatHistory
        ? chatHistory.map((msg) => createLLMChatMessage(msg.content, msg.type))
        : [],
    );

    // first return sources，use unique tag for parse data
    res.write(JSON.stringify(sources) || '');
    res.write(LLM_SPLIT);

    const getSSEData = async (stream) => {
      // write answer in a stream style
      let answerStr = '';
      for await (const chunk of await stream) {
        const chunkStr =
          chunk?.content || (typeof chunk === 'string' ? chunk : '');
        answerStr += chunkStr || '';

        res.write(chunkStr || '');
      }

      return answerStr;
    };

    const [answerStr, relatedQuestions] = await Promise.all([
      getSSEData(stream),
      this.llmService.getRelatedQuestion(sources, query, locale),
    ]);

    this.logger.log('relatedQuestions', relatedQuestions);

    res.write(RELATED_SPLIT);
    res.write(JSON.stringify(relatedQuestions) || '');

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
    res: Response,
    userId: number,
    task: Task,
  ): Promise<TaskResponse> {
    const data = task?.data as QUICK_ACTION_TASK_PAYLOAD;
    const locale = task?.locale || LOCALE.EN;

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

    res.write(JSON.stringify(sources) || '');
    res.write(LLM_SPLIT);

    const weblinkList = data?.filter?.weblinkList;
    if (weblinkList?.length <= 0) return;

    // save user mark for each weblink in a non-blocking style
    this.weblinkService.saveWeblinkUserMarks({
      userId,
      weblinkList,
    });

    // 基于一组网页做总结，先获取网页内容
    const docs = await this.weblinkService.parseMultiWeblinks(weblinkList);

    let stream: IterableReadableStream<BaseMessageChunk>;
    if (data?.actionType === QUICK_ACTION_TYPE.SUMMARY) {
      const weblinkList = data?.filter?.weblinkList;
      if (weblinkList?.length <= 0) return;

      stream = await this.llmService.summary(data?.actionPrompt, locale, docs);
    }

    const getSSEData = async (stream) => {
      // write answer in a stream style
      let answerStr = '';
      for await (const chunk of await stream) {
        const chunkStr =
          chunk?.content || (typeof chunk === 'string' ? chunk : '');
        answerStr += chunkStr;

        res.write(chunkStr || '');
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
        locale,
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
