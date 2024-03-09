import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { PrismaService } from '../prisma.service';
import { LlmService } from '../llm/llm.service';

@Module({
  imports: [ConfigModule],
  controllers: [ConversationController],
  providers: [ConversationService, LlmService, PrismaService],
})
export class ConversationModule {}
