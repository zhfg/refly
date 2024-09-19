import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';

import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { CommonModule } from '@/common/common.module';
import { RAGModule } from '@/rag/rag.module';
import { SubscriptionModule } from '@/subscription/subscription.module';
import { ResourceProcessor } from './knowledge.processor';
import { NoteWsGateway } from './knowledge.gateway';
import { QUEUE_RESOURCE, QUEUE_SIMPLE_EVENT, QUEUE_SYNC_STORAGE_USAGE } from '@/utils';

@Module({
  imports: [
    CommonModule,
    ConfigModule,
    RAGModule,
    SubscriptionModule,
    BullModule.registerQueue({ name: QUEUE_RESOURCE }),
    BullModule.registerQueue({ name: QUEUE_SIMPLE_EVENT }),
    BullModule.registerQueue({ name: QUEUE_SYNC_STORAGE_USAGE }),
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, ResourceProcessor, NoteWsGateway],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
