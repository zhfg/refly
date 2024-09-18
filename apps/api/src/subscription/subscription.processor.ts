import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import { SubscriptionService } from './subscription.service';
import { QUEUE_SYNC_TOKEN_USAGE, QUEUE_SYNC_STORAGE_USAGE } from '../utils/const';
import { SyncTokenUsageJobData, SyncStorageUsageJobData } from './subscription.dto';

@Processor(QUEUE_SYNC_TOKEN_USAGE)
export class SyncTokenUsageProcessor {
  private readonly logger = new Logger(SyncTokenUsageProcessor.name);

  constructor(private subscriptionService: SubscriptionService) {}

  @Process()
  async handleSyncTokenUsage(job: Job<SyncTokenUsageJobData>) {
    this.logger.log(`[handleSyncTokenUsage] job: ${JSON.stringify(job)}`);
    await this.subscriptionService.syncTokenUsage(job.data);
  }
}

@Processor(QUEUE_SYNC_STORAGE_USAGE)
export class SyncStorageUsageProcessor {
  private readonly logger = new Logger(SyncStorageUsageProcessor.name);

  constructor(private subscriptionService: SubscriptionService) {}

  @Process()
  async handleSyncStorageUsage(job: Job<SyncStorageUsageJobData>) {
    this.logger.log(`[handleSyncStorageUsage] job: ${JSON.stringify(job)}`);
    await this.subscriptionService.syncStorageUsage(job.data);
  }
}
