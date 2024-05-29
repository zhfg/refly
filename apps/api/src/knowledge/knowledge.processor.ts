import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import { UpsertResourceRequest } from '@refly/schema';
import { KnowledgeService } from './knowledge.service';
import { QUEUE_RESOURCE, CHANNEL_FINALIZE_RESOURCE } from '../utils/const';

@Processor(QUEUE_RESOURCE)
export class ResourceProcessor {
  private readonly logger = new Logger(ResourceProcessor.name);

  constructor(private knowledgeService: KnowledgeService) {}

  @Process(CHANNEL_FINALIZE_RESOURCE)
  async handleFinalizeResource(job: Job<UpsertResourceRequest>) {
    this.logger.log(`[handleFinalizeResource] job: ${JSON.stringify(job)}`);

    await this.knowledgeService.finalizeResource(job.data);
  }
}
