import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import { WebLinkDTO } from './dto';
import { WeblinkService } from './weblink.service';

@Processor('index')
export class WeblinkProcessor {
  private readonly logger = new Logger(WeblinkProcessor.name);

  constructor(private weblinkService: WeblinkService) {}

  @Process('indexWebLink')
  async handleWebLink(job: Job<WebLinkDTO>) {
    this.logger.log(`handle web link, job: ${JSON.stringify(job)}`);

    const link = job.data;
    await this.weblinkService.processLinkForUser(link);
    await this.weblinkService.processLinkForGlobal(link);
  }
}
