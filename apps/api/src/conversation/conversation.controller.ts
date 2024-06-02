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
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  CreateConversationRequest,
  CreateConversationResponse,
  ListConversationResponse,
  ConversationListItem,
  ChatRequest,
  GetConversationDetailResponse,
} from '@refly/openapi-schema';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ConversationService } from './conversation.service';
import { Conversation } from '@prisma/client';
import { buildSuccessResponse, pick } from '../utils';

const convertConversationToListItem = (conversation: Conversation): ConversationListItem => {
  return {
    ...pick(conversation, [
      'convId',
      'title',
      'lastMessage',
      'messageCount',
      'cid',
      'origin',
      'originPageTitle',
      'originPageUrl',
    ]),
    createdAt: conversation.createdAt.toJSON(),
    updatedAt: conversation.updatedAt.toJSON(),
  };
};

@Controller('conversation')
export class ConversationController {
  private logger = new Logger(ConversationController.name);

  constructor(private conversationService: ConversationService) {}

  @UseGuards(JwtAuthGuard)
  @Post('new')
  async createConversation(
    @Request() req,
    @Body() body: CreateConversationRequest,
  ): Promise<CreateConversationResponse> {
    const conversation = await this.conversationService.createConversation(req.user, body);
    return buildSuccessResponse(convertConversationToListItem(conversation));
  }

  @UseGuards(JwtAuthGuard)
  @Post('chat')
  async chatV2(@Request() req, @Res() res: Response, @Body() body: ChatRequest) {
    const { task } = body;

    if (task.taskType === 'chat' && !task.data?.question) {
      throw new BadRequestException('query cannot be empty for chat task');
    }

    if (!task.convId) {
      throw new BadRequestException('convId cannot be empty');
    }

    let chatConv: Conversation;
    if (!task.dryRun) {
      let conversation: Conversation = await this.conversationService.findConversation(task.convId);

      if (conversation) {
        if (conversation.userId !== req.user.id) {
          throw new UnauthorizedException('cannot access this conversation');
        }
      } else {
        if (!task.createConvParam) {
          throw new BadRequestException('createConvParam cannot be empty');
        }
        conversation = await this.conversationService.createConversation(
          req.user,
          {
            ...task.createConvParam,
            title: task.data?.question,
          },
          task.convId,
        );
      }

      chatConv = conversation;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.status(200);

    await this.conversationService.chat(res, req.user, chatConv, task);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':conversationId/chat')
  async chat(
    @Request() req,
    @Param('conversationId') conversationId = '',
    @Body() body: ChatRequest,
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
    if (task.taskType === 'chat' && !task.data?.question) {
      throw new BadRequestException('query cannot be empty for chat task');
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.status(200);

    await this.conversationService.chat(res, req.user, conversation, body.task);
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async listConversation(
    @Request() req,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
  ): Promise<ListConversationResponse> {
    const parsedPage = parseInt(page);
    const parsedPageSize = parseInt(pageSize);

    const conversationList = await this.conversationService.getConversations({
      skip: (parsedPage - 1) * parsedPageSize,
      take: parsedPageSize,
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return buildSuccessResponse(
      conversationList.map((conv) => convertConversationToListItem(conv)),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':convId')
  async showConversationDetail(
    @Request() req,
    @Param('convId') convId: string,
  ): Promise<GetConversationDetailResponse> {
    const data = await this.conversationService.findConversation(convId, true);
    return buildSuccessResponse(data.userId === (req.user.id as number) ? data : {});
  }
}
