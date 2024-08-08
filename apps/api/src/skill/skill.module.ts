import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { KnowledgeModule } from '@/knowledge/knowledge.module';
import { SkillService } from './skill.service';
import { SkillController } from './skill.controller';
import { CommonModule } from '@/common/common.module';
import { ConversationModule } from '@/conversation/conversation.module';
import { SearchModule } from '@/search/search.module';
import { QUEUE_SKILL } from '@/utils';
import { LabelModule } from '@/label/label.module';
import { SkillProcessor } from '@/skill/skill.processor';

@Module({
  imports: [
    CommonModule,
    ConfigModule,
    LabelModule,
    SearchModule,
    KnowledgeModule,
    ConversationModule,
    BullModule.registerQueue({ name: QUEUE_SKILL }),
  ],
  providers: [SkillService, SkillProcessor],
  controllers: [SkillController],
  exports: [SkillService],
})
export class SkillModule {}
