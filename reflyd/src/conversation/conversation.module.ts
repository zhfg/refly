import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { WeblinkModule } from '../weblink/weblink.module';
import { LlmModule } from '../llm/llm.module';
import { CommonModule } from '../common/common.module';
import { AigcModule } from '../aigc/aigc.module';

@Module({
  imports: [ConfigModule, CommonModule, WeblinkModule, AigcModule, LlmModule],
  controllers: [ConversationController],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationModule {}
