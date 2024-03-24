import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import { WebLinkDTO } from './dto';
import { WeblinkService } from './weblink.service';
import { QUEUE_STORE_LINK } from '../utils/const';

@Processor(QUEUE_STORE_LINK)
export class WeblinkProcessor {
  private readonly logger = new Logger(WeblinkProcessor.name);

  constructor(private weblinkService: WeblinkService) {}

  @Process('indexWebLink')
  async handleWebLink(job: Job<WebLinkDTO>) {
    this.logger.log(`handle web link, job: ${JSON.stringify(job)}`);

    await this.weblinkService.processLinkFromStoreQueue(job.data);
  }
}
