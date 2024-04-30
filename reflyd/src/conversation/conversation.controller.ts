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
} from './conversation.dto';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ConversationService } from './conversation.service';
import { TASK_TYPE, type Task } from './conversation.dto';

@Controller('conversation')
export class ConversationController {
  private logger = new Logger(ConversationController.name);

  constructor(private conversationService: ConversationService) {}

  @UseGuards(JwtAuthGuard)
  @Post('new')
  @ApiResponse({ type: CreateConversationResponse })
  async createConversation(@Request() req, @Body() body: CreateConversationParam) {
    return { data: await this.conversationService.createConversation(body, req.user) };
  }

  @UseGuards(JwtAuthGuard)
  @Post('chat')
  async chatV2(@Request() req, @Res() res: Response, @Body() body: { task: Task }) {
    const { task } = body;

    if (task.taskType === TASK_TYPE.CHAT && !task.data?.question) {
      throw new BadRequestException('query cannot be empty for chat task');
    }

    // create new conversation if convId not exists
    if (!task.convId) {
      const conversation = await this.conversationService.createConversation(
        { ...task.createConvParam, title: task.data?.question },
        req.user,
      );
      task.convId = conversation.convId;
      task.conversation = conversation;
    } else {
      task.conversation = await this.conversationService.findConversation(task.convId);
      if (!task.conversation) {
        throw new BadRequestException('conversation not found: ' + task.convId);
      }
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.status(200);

    await this.conversationService.chat(res, req.user, task);
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

    const id = Number(conversationId);
    const conversation = await this.conversationService.findConversationById(id);

    if (!conversation) {
      throw new BadRequestException('conversation not found: ' + id);
    }

    const { task } = body;
    if (!task) {
      throw new BadRequestException('task cannot be empty');
    }
    if (task.taskType === TASK_TYPE.CHAT && !task.data?.question) {
      throw new BadRequestException('query cannot be empty for chat task');
    }
    task.conversation = conversation;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.status(200);

    await this.conversationService.chat(res, req.user, body.task);
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
  @Get(':convId')
  @ApiParam({ name: 'convId' })
  @ApiResponse({ type: ListConversationResponse })
  async showConversationDetail(@Request() req, @Param('convId') convId: string) {
    const data = await this.conversationService.findConversation(convId, true);

    return data.userId === (req.user.id as number) ? { data } : { data: {} };
  }
}
