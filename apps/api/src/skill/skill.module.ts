import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { KnowledgeModule } from '@/knowledge/knowledge.module';
import { SkillService } from './skill.service';
import { SkillController } from './skill.controller';
import { CommonModule } from '@/common/common.module';
import { ConversationModule } from '@/conversation/conversation.module';
import { SearchModule } from '@/search/search.module';
import { CanvasModule } from '@/canvas/canvas.module';
import { RAGModule } from '@/rag/rag.module';
import { QUEUE_SYNC_TOKEN_USAGE, QUEUE_SKILL } from '@/utils';
import { LabelModule } from '@/label/label.module';
import { SkillProcessor } from '@/skill/skill.processor';
import { SubscriptionModule } from '@/subscription/subscription.module';
import { CollabModule } from '@/collab/collab.module';

@Module({
  imports: [
    CommonModule,
    ConfigModule,
    LabelModule,
    SearchModule,
    CanvasModule,
    KnowledgeModule,
    RAGModule,
    ConversationModule,
    SubscriptionModule,
    CollabModule,
    BullModule.registerQueue({ name: QUEUE_SKILL }),
    BullModule.registerQueue({ name: QUEUE_SYNC_TOKEN_USAGE }),
  ],
  providers: [SkillService, SkillProcessor],
  controllers: [SkillController],
  exports: [SkillService],
})
export class SkillModule {}
