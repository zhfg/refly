import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CanvasController } from './canvas.controller';
import { CanvasService } from './canvas.service';
import {
  ClearCanvasEntityProcessor,
  SyncCanvasEntityProcessor,
  AutoNameCanvasProcessor,
  DuplicateCanvasProcessor,
} from './canvas.processor';
import { CollabModule } from '@/collab/collab.module';
import { QUEUE_DELETE_KNOWLEDGE_ENTITY, QUEUE_DUPLICATE_CANVAS } from '@/utils/const';
import { CommonModule } from '@/common/common.module';
import { MiscModule } from '@/misc/misc.module';
import { SubscriptionModule } from '@/subscription/subscription.module';
import { KnowledgeModule } from '@/knowledge/knowledge.module';
import { ActionModule } from '@/action/action.module';

@Module({
  imports: [
    CommonModule,
    CollabModule,
    MiscModule,
    KnowledgeModule,
    ActionModule,
    SubscriptionModule,
    BullModule.registerQueue({
      name: QUEUE_DELETE_KNOWLEDGE_ENTITY,
    }),
    BullModule.registerQueue({
      name: QUEUE_DUPLICATE_CANVAS,
    }),
  ],
  controllers: [CanvasController],
  providers: [
    CanvasService,
    SyncCanvasEntityProcessor,
    ClearCanvasEntityProcessor,
    AutoNameCanvasProcessor,
    DuplicateCanvasProcessor,
  ],
  exports: [CanvasService],
})
export class CanvasModule {}
