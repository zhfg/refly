import { Injectable, Logger } from '@nestjs/common';
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

const LLM_SPLIT = '__LLM_RESPONSE__';
const RELATED_SPLIT = '__RELATED_QUESTIONS__';

@Injectable()
export class ConversationService {
  private logger = new Logger(ConversationService.name);

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

    // 前置的数据处理
    const query = task?.data?.question;
    const llmChatMessages = chatHistory
      ? chatHistory.map((msg) => createLLMChatMessage(msg.content, msg.type))
      : [];
    const questionWithContext =
      chatHistory.length === 0
        ? query
        : await this.llmService.getContextualQuestion(query, llmChatMessages);

    // 如果有 cssSelector，则代表从基于选中的内容进行提问，否则根据上下文进行相似度匹配召回
    const chatFromClientSelector = task?.data?.filter?.weblinkList?.find(
      (item) => item?.cssSelector?.length > 0,
    );
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
  ) {
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
        console.log('chunk', chunk);
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
  ) {
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

    // write answer in a stream style
    let answerStr = '';

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

    // 构建一个 promise 用于处理 summary 输出
    const promise = new Promise(async (resolve, reject) => {
      // 这里用于回调
      const onMessage = (chunk: string) => {
        answerStr += chunk;

        res.write(chunk);
      };

      // summarize 输出结束之后将 related questions 写回
      const onEnd = (output) => {
        resolve(output);
      };

      const onError = (err) => {
        this.logger.error(`output summary error: ${err}`);
        reject(err);
      };

      if (data?.actionType === QUICK_ACTION_TYPE.SUMMARY) {
        const weblinkList = data?.filter?.weblinkList;
        if (weblinkList?.length <= 0) return;

        await this.llmService.summary(
          data?.actionPrompt,
          docs,
          chatHistory,
          onMessage,
          onEnd,
          onError,
        );
      }
    });

    const getUserQuestion = (actionType: QUICK_ACTION_TYPE) => {
      switch (actionType) {
        case QUICK_ACTION_TYPE.SUMMARY: {
          return '总结网页';
        }
      }
    };

    const [_, relatedQuestions] = await Promise.all([
      promise,
      this.llmService.getRelatedQuestion(
        docs,
        getUserQuestion(data?.actionType),
      ),
    ]);

    console.log('relatedQuestions', relatedQuestions);

    res.write(RELATED_SPLIT);
    res.write(JSON.stringify(relatedQuestions));

    return {
      sources,
      answer: answerStr,
      relatedQuestions,
    };
  }
}
