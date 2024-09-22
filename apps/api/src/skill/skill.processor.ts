import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import { SkillService } from './skill.service';
import { CHANNEL_INVOKE_SKILL, QUEUE_SKILL } from '../utils/const';
import { InvokeSkillJobData } from './skill.dto';

@Processor(QUEUE_SKILL)
export class SkillProcessor {
  private readonly logger = new Logger(SkillProcessor.name);

  constructor(private skillService: SkillService) {}

  @Process(CHANNEL_INVOKE_SKILL)
  async handleInvokeSkill(job: Job<InvokeSkillJobData>) {
    this.logger.log(`[handleInvokeSkill] job: ${JSON.stringify(job)}`);

    try {
      await this.skillService.invokeSkillFromQueue(job.data);
    } catch (error) {
      this.logger.error(`[handleInvokeSkill] error: ${error?.stack}`);
      throw error;
    }
  }
}
