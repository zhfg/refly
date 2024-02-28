import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { PrismaService } from '../prisma.service';
import { LlmService } from '../llm/llm.service';

@Module({
  controllers: [ConversationController],
  providers: [ConversationService, LlmService, PrismaService],
})
export class ConversationModule {}
