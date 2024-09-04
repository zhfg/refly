import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { CommonModule } from '@/common/common.module';
import { ReportTokenUsageProcessor } from '@/subscription/subscription.processor';

@Module({
  imports: [CommonModule],
  providers: [SubscriptionService],
  controllers: [SubscriptionController, ReportTokenUsageProcessor],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
