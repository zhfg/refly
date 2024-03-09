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
import { ConversationService } from './conversation.service';
import { LlmService } from '../llm/llm.service';
import { createLCChatMessage } from '../llm/schema';

@Controller('conversation')
export class ConversationController {
  private readonly logger = new Logger(ConversationController.name);

  constructor(
    private conversationService: ConversationService,
    private llmService: LlmService,
  ) {}

  @Post('new')
  @ApiResponse({ type: CreateConversationResponse })
  async createConversation(
    @Request() req,
    @Body() body: CreateConversationParam,
  ) {
    // TODO: replace this with actual user
    const res = await this.conversationService.create(
      body,
      '5c0a7922c9d89830f4911426',
    );

    return {
      data: res,
    };
  }

  @Post(':conversationId/chat')
  async chat(
    @Query('query') query = '',
    @Param('conversationId') conversationId = '',
    @Body() body: { weblinkList: string[] },
    @Res() res: Response,
  ) {
    console.log('query', query, conversationId, body);
    if (!conversationId) {
      throw new BadRequestException('conversation id cannot be empty');
    }

    if (!query) {
      throw new BadRequestException('query cannot be empty');
    }

    // TODO: replace this with actual user
    const userId = '5c0a7922c9d89830f4911426';

    await this.conversationService.addChatMessage({
      type: 'human',
      userId,
      conversationId: conversationId,
      content: query,
      sources: '',
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.status(200);

    // 获取聊天历史
    const chatHistory = await this.conversationService.getMessages(
      conversationId,
    );

    const filter: any = {
      must: [
        {
          key: 'userId',
          match: { value: userId },
        },
      ],
    };
    if (body.weblinkList.length > 0) {
      filter.must.push({
        key: 'source',
        match: { any: body.weblinkList },
      });
    }

    const { stream, sources } = await this.llmService.chat(
      query,
      chatHistory
        ? chatHistory.map((msg) => createLCChatMessage(msg.content, msg.type))
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

    res.end(`[DONE]`);

    await this.conversationService.addChatMessage({
      type: 'ai',
      userId,
      conversationId,
      content: answerStr,
      sources: JSON.stringify(sources),
    });

    // update conversation last answer and message count
    const updated = await this.conversationService.updateConversation(
      conversationId,
      {
        lastMessage: answerStr,
        messageCount: chatHistory.length + 1,
      },
    );
    this.logger.log(
      `update conversation ${conversationId}, after updated: ${JSON.stringify(
        updated,
      )}`,
    );
  }

  @Get('list')
  @ApiResponse({ type: ListConversationResponse })
  async listConversation(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
  ) {
    const parsedPage = parseInt(page);
    const parsedPageSize = parseInt(pageSize);

    const conversationList = await this.conversationService.getConversations({
      skip: (parsedPage - 1) * parsedPageSize,
      take: parsedPageSize,
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: conversationList,
    };
  }

  @Get(':conversationId')
  @ApiParam({ name: 'conversationId' })
  @ApiResponse({ type: ListConversationResponse })
  async showConversationDetail(
    @Param('conversationId') conversationId: string,
  ) {
    const conversation = await this.conversationService.findFirstConversation({
      where: { id: conversationId },
    });
    const messages = await this.conversationService.getMessages(
      conversation?.conversationId as string,
    );

    return {
      data: {
        ...conversation,
        messages: messages,
      },
    };
  }
}
