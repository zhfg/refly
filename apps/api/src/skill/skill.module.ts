import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { SkillService } from './skill.service';
import { SkillController } from './skill.controller';
import { CommonModule } from '../common/common.module';
import { QUEUE_SKILL } from '../utils';
import { ConversationModule } from '../conversation/conversation.module';

@Module({
  imports: [
    CommonModule,
    ConfigModule,
    KnowledgeModule,
    ConversationModule,
    BullModule.registerQueue({ name: QUEUE_SKILL }),
  ],
  providers: [SkillService],
  controllers: [SkillController],
})
export class SkillModule {}
