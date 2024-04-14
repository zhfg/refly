import {
  Controller,
  Logger,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
  Body,
  Res,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  CreateConversationParam,
  CreateConversationResponse,
  ListConversationResponse,
} from './dto';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ConversationService } from './conversation.service';
import { TASK_TYPE, type Task } from '../types/task';
import { AigcService } from '../aigc/aigc.service';
import { LoggerService } from '../common/logger.service';

@Controller('conversation')
export class ConversationController {
  constructor(
    private logger: LoggerService,
    private conversationService: ConversationService,
    private aigcService: AigcService,
  ) {
    this.logger.setContext(ConversationController.name);
  }

  @UseGuards(JwtAuthGuard)
  @Post('new')
  @ApiResponse({ type: CreateConversationResponse })
  async createConversation(
    @Request() req,
    @Body() body: CreateConversationParam,
  ) {
    const userId: number = req.user.id;
    const res = await this.conversationService.create(body, userId);

    if (body.contentId) {
      const content = await this.aigcService.getContent({
        contentId: body.contentId,
      });
      await this.conversationService.addChatMessages([
        {
          type: 'human',
          content: content.title,
          sources: '[]',
          userId,
          conversationId: res.id,
        },
        {
          type: 'ai',
          content: content.content,
          sources: content.sources,
          userId,
          conversationId: res.id,
        },
      ]);
      await this.conversationService.updateConversation(res.id, {
        messageCount: { increment: 2 },
        lastMessage: content.content,
      });
    }

    return {
      data: res,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':conversationId/chat')
  async chat(
    @Request() req,
    @Param('conversationId') conversationId = '',
    @Body() body: { task: Task },
    @Res() res: Response,
  ) {
    try {
      if (!conversationId || !Number(conversationId)) {
        throw new BadRequestException('invalid conversation id');
      }
      const convId = Number(conversationId);

      const { taskType, data = {} } = body?.task;
      if (taskType === TASK_TYPE.CHAT && !data?.question) {
        throw new BadRequestException('query cannot be empty');
      }

      const userId: number = req.user.id;
      const query = data?.question || '';
      const weblinkList = body?.task?.data?.filter?.weblinkList || [];

      await this.conversationService.addChatMessage({
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
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.status(200);

      // 获取聊天历史
      const chatHistory = await this.conversationService.getMessages(convId);

      let sources, answer;
      if (taskType === TASK_TYPE.CHAT) {
        const taskRes = await this.conversationService.handleChatTask(
          req,
          res,
          body?.task,
          chatHistory,
        );

        sources = taskRes?.sources;
        answer = taskRes?.answer;
      } else if (taskType === TASK_TYPE.QUICK_ACTION) {
        const taskRes = await this.conversationService.handleQuickActionTask(
          req,
          res,
          body?.task,
          chatHistory,
        );
        sources = taskRes?.sources;
        answer = taskRes?.answer;
      } else if (taskType === TASK_TYPE.SEARCH_ENHANCE_ASK) {
        const taskRes = await this.conversationService.handleSearchEnhanceTask(
          req,
          res,
          body?.task,
          chatHistory,
        );

        sources = taskRes?.sources;
        answer = taskRes?.answer;
      }
      res.end(``);

      await this.conversationService.addChatMessage({
        type: 'ai',
        userId,
        conversationId: convId,
        content: answer,
        sources: JSON.stringify(sources),
      });

      // update conversation last answer and message count
      const updated = await this.conversationService.updateConversation(
        convId,
        {
          lastMessage: answer,
          messageCount: chatHistory.length + 1,
        },
      );
      this.logger.log(
        `update conversation ${convId}, after updated: ${JSON.stringify(
          updated,
        )}`,
      );
    } catch (err) {
      console.log('chat error', err);

      // 结束流式输出
      res.end(``);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  @ApiResponse({ type: ListConversationResponse })
  async listConversation(
    @Request() req,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
  ) {
    const parsedPage = parseInt(page);
    const parsedPageSize = parseInt(pageSize);

    const conversationList = await this.conversationService.getConversations({
      skip: (parsedPage - 1) * parsedPageSize,
      take: parsedPageSize,
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: conversationList,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':conversationId')
  @ApiParam({ name: 'conversationId' })
  @ApiResponse({ type: ListConversationResponse })
  async showConversationDetail(
    @Request() req,
    @Param('conversationId') conversationId: string,
  ) {
    const convId = Number(conversationId);
    if (!convId) {
      return { data: {} };
    }

    const data = await this.conversationService.findConversationAndMessages(
      convId,
    );

    return data.userId === (req.user.id as number) ? { data } : { data: {} };
  }
}
