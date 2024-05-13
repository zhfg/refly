import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import { WebLinkDTO } from './weblink.dto';
import { WeblinkService } from './weblink.service';
import { PROCESS_LINK_BY_USER_CHANNEL, PROCESS_LINK_CHANNEL, QUEUE_WEBLINK } from '../utils/const';

@Processor(QUEUE_WEBLINK)
export class WeblinkProcessor {
  private readonly logger = new Logger(WeblinkProcessor.name);

  constructor(private weblinkService: WeblinkService) {}

  @Process(PROCESS_LINK_BY_USER_CHANNEL)
  async handleWebLinkForUser(job: Job<WebLinkDTO>) {
    this.logger.log(`[handleWebLinkForUser] job: ${JSON.stringify(job)}`);

    await this.weblinkService.processLinkByUser(job.data);
  }

  @Process(PROCESS_LINK_CHANNEL)
  async handleWebLink(job: Job<WebLinkDTO>) {
    this.logger.log(`[handleWebLink] job: ${JSON.stringify(job)}`);

    await this.weblinkService.processLink(job.data);
  }
}
