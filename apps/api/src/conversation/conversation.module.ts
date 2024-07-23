import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [ConfigModule, CommonModule],
  controllers: [ConversationController],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationModule {}
