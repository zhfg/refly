import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import { WeblinkJobData } from './weblink.dto';
import { WeblinkService } from './weblink.service';
import { CHANNEL_PROCESS_LINK_BY_USER, CHANNEL_PROCESS_LINK, QUEUE_WEBLINK } from '../utils/const';

@Processor(QUEUE_WEBLINK)
export class WeblinkProcessor {
  private readonly logger = new Logger(WeblinkProcessor.name);

  constructor(private weblinkService: WeblinkService) {}

  @Process(CHANNEL_PROCESS_LINK_BY_USER)
  async handleWebLinkForUser(job: Job<WeblinkJobData>) {
    this.logger.log(`[handleWebLinkForUser] job: ${JSON.stringify(job)}`);

    await this.weblinkService.processLinkByUser(job.data);
  }

  @Process(CHANNEL_PROCESS_LINK)
  async handleWebLink(job: Job<WeblinkJobData>) {
    this.logger.log(`[handleWebLink] job: ${JSON.stringify(job)}`);

    await this.weblinkService.processLink(job.data);
  }
}
