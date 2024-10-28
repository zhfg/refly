import {
  Controller,
  Logger,
  Get,
  Post,
  Query,
  UseGuards,
  Body,
  Param,
  ParseIntPipe,
  DefaultValuePipe,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateConversationRequest,
  CreateConversationResponse,
  ListConversationResponse,
  GetConversationDetailResponse,
} from '@refly-packages/openapi-schema';
import { User as UserModel } from '@prisma/client';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { ConversationService } from './conversation.service';
import { buildSuccessResponse } from '@/utils';
import { User } from '@/utils/decorators/user.decorator';
import { conversationPO2DTO } from '@/conversation/conversation.dto';

@Controller('conversation')
export class ConversationController {
  private logger = new Logger(ConversationController.name);

  constructor(private conversationService: ConversationService) {}

  @UseGuards(JwtAuthGuard)
  @Post('new')
  async createConversation(
    @User() user: UserModel,
    @Body() body: CreateConversationRequest,
  ): Promise<CreateConversationResponse> {
    const conversation = await this.conversationService.upsertConversation(user, body);
    return buildSuccessResponse(conversationPO2DTO(conversation));
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async listConversation(
    @User() user: UserModel,
    @Query('projectId') projectId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ): Promise<ListConversationResponse> {
    const conversationList = await this.conversationService.listConversations(user, {
      projectId,
      page,
      pageSize,
    });

    return buildSuccessResponse(conversationList?.map(conversationPO2DTO));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':convId')
  async showConversationDetail(
    @User() user: UserModel,
    @Param('convId') convId: string,
  ): Promise<GetConversationDetailResponse> {
    const data = await this.conversationService.getConversationDetail(user, convId);
    if (!data?.convId) {
      throw new NotFoundException('conversation not found');
    }
    return buildSuccessResponse(conversationPO2DTO(data));
  }
}
