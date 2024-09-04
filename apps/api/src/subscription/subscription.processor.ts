import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import { SubscriptionService } from './subscription.service';
import { QUEUE_REPORT_TOKEN_USAGE } from '../utils/const';
import { ReportTokenUsageJobData } from './subscription.dto';

@Processor(QUEUE_REPORT_TOKEN_USAGE)
export class ReportTokenUsageProcessor {
  private readonly logger = new Logger(ReportTokenUsageProcessor.name);

  constructor(private subscriptionService: SubscriptionService) {}

  @Process()
  async handleReportTokenUsage(job: Job<ReportTokenUsageJobData>) {
    this.logger.log(`[handleReportTokenUsage] job: ${JSON.stringify(job)}`);
    await this.subscriptionService.updateTokenUsage(job.data);
  }
}
