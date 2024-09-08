import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeModule } from '@golevelup/nestjs-stripe';
import { SubscriptionService } from './subscription.service';
import { ReportTokenUsageProcessor } from './subscription.processor';
import { SubscriptionController } from './subscription.controller';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [CommonModule, ConfigModule, StripeModule.externallyConfigured(StripeModule, 0)],
  providers: [SubscriptionService, ReportTokenUsageProcessor],
  controllers: [SubscriptionController],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
