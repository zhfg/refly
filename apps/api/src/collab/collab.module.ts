import { Module } from '@nestjs/common';
import { CollabGateway } from './collab.gateway';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '@/common/common.module';
import { RAGModule } from '@/rag/rag.module';
import { MiscModule } from '@/misc/misc.module';
import { SubscriptionModule } from '@/subscription/subscription.module';
import { CollabService } from './collab.service';

@Module({
  imports: [CommonModule, ConfigModule, RAGModule, MiscModule, SubscriptionModule],
  providers: [CollabGateway, CollabService],
})
export class CollabModule {}
