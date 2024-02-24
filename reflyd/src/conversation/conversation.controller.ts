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
  ChatParam,
  CreateConversationParam,
  CreateConversationResponse,
  ListConversationResponse,
  RetrieveParam,
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
    return this.conversationService.create(body, '5c0a7922c9d89830f4911426');
  }

  @Post('retrieve')
  async retrieveDocs(@Body() body: RetrieveParam) {
    return this.llmService.retrieveRelevantDocs(body.input.query);
  }

  @Post('chat')
  async chat(@Body() body: ChatParam, @Res() res: Response) {
    if (!body.conversationId) {
      throw new BadRequestException('conversation id cannot be empty');
    }

    // TODO: replace this with actual user
    const userId = '5c0a7922c9d89830f4911426';

    await this.conversationService.addChatMessage({
      source: 'human',
      userId,
      conversationId: body.conversationId,
      content: body.query,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.status(200);

    const stream = await this.llmService.chat(
      body.query,
      body.chatHistory
        ? body.chatHistory.map((msg) =>
            createLCChatMessage(msg.content, msg.type),
          )
        : [],
    );

    // write answer in a stream style
    let answerStr = '';
    for await (const chunk of stream) {
      answerStr += chunk;
      res.write(`data: ${chunk}\n\n`);
    }

    res.end(`data: [DONE]\n\n`);

    await this.conversationService.addChatMessage({
      source: 'ai',
      userId,
      conversationId: body.conversationId,
      content: answerStr,
    });
  }

  @Get('list')
  @ApiResponse({ type: ListConversationResponse })
  async listConversation(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
  ) {
    return this.conversationService.getConversations({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  @Get(':conversationId')
  @ApiParam({ name: 'conversationId' })
  @ApiResponse({ type: ListConversationResponse })
  async showConversationDetail(
    @Param('conversationId') conversationId: string,
  ) {
    const conversation = await this.conversationService.findFirstConversation({
      where: { conversationId },
    });
    const messages = await this.conversationService.getMessages(conversationId);

    return { ...conversation, messages: messages };
  }
}
