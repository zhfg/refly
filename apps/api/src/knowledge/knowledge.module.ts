import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';

import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { CommonModule } from '../common/common.module';
import { RAGModule } from '../rag/rag.module';
import { ResourceProcessor } from './knowledge.processor';
import { NoteWsGateway } from './knowledge.gateway';
import { QUEUE_RESOURCE, QUEUE_SIMPLE_EVENT } from '../utils';

@Module({
  imports: [
    CommonModule,
    ConfigModule,
    RAGModule,
    BullModule.registerQueue({ name: QUEUE_RESOURCE }),
    BullModule.registerQueue({ name: QUEUE_SIMPLE_EVENT }),
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, ResourceProcessor, NoteWsGateway],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
