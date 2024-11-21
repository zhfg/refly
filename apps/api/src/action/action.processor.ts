import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import { ActionService } from './action.service';
import { QUEUE_ACTION } from '../utils/const';
import { InvokeActionJobData } from './action.dto';

@Processor(QUEUE_ACTION)
export class ActionProcessor {
  private readonly logger = new Logger(ActionProcessor.name);

  constructor(private actionService: ActionService) {}

  @Process()
  async handleInvokeAction(job: Job<InvokeActionJobData>) {
    this.logger.log(`[handleInvokeAction] job: ${JSON.stringify(job)}`);
  }
}
