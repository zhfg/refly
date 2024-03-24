import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { WeblinkModule } from '../weblink/weblink.module';
import { LlmModule } from '../llm/llm.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [ConfigModule, CommonModule, WeblinkModule, LlmModule],
  controllers: [ConversationController],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationModule {}
