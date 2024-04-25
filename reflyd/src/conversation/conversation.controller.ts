import {
  Controller,
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
  CreateChatMessageInput,
  CreateConversationParam,
  CreateConversationResponse,
  ListConversationResponse,
} from './dto';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ConversationService } from './conversation.service';
import { LOCALE, TASK_TYPE, type Task } from '../types/task';
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
      const messages: CreateChatMessageInput[] = [
        {
          type: 'human',
          content: content.title,
          sources: '[]',
          userId,
          conversationId: res.id,
          locale: body.locale,
        },
        {
          type: 'ai',
          content: content.content,
          sources: content.sources,
          userId,
          conversationId: res.id,
          locale: body.locale,
        },
      ];
      await Promise.all([
        this.conversationService.addChatMessages(messages),
        this.conversationService.updateConversation(
          res.id,
          messages,
          {
            messageCount: { increment: 2 },
            lastMessage: content.content,
          },
          body?.locale as LOCALE,
        ),
      ]);
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
    if (!conversationId || !Number(conversationId)) {
      throw new BadRequestException('invalid conversation id');
    }
    const convId = Number(conversationId);
    const { task } = body;
    if (!task) {
      throw new BadRequestException('task cannot be empty');
    }
    if (task.taskType === TASK_TYPE.CHAT && !task.data?.question) {
      throw new BadRequestException('query cannot be empty for chat task');
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.status(200);

    await this.conversationService.chat(res, convId, req.user.id, body.task);
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
