import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import { Weblink } from '@prisma/client';
import { LlmService } from '../llm/llm.service';
import { PrismaService } from '../prisma.service';

@Processor('index')
export class WeblinkProcessor {
  private readonly logger = new Logger(WeblinkProcessor.name);

  constructor(private prisma: PrismaService, private llmService: LlmService) {}

  @Process('indexWebLink')
  async handleWebLink(job: Job<Weblink>) {
    this.logger.log(`handle web link, job: ${job}`);

    const link = job.data;
    await this.prisma.weblink.update({
      where: { linkId: link.linkId },
      data: { indexStatus: 'processing' },
    });
    this.logger.log(`start to process link: ${link.url}`);

    await this.llmService.parseAndStoreLink(link);
    this.logger.log(`finish process link: ${link.url}`);

    await this.prisma.weblink.update({
      where: { linkId: link.linkId },
      data: { indexStatus: 'finish' },
    });
  }
}
