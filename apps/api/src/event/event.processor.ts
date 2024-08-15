import { Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import { EventService } from './event.service';
import { QUEUE_SIMPLE_EVENT } from '@/utils/const';
import { SimpleEventData } from '@/event/event.dto';

@Processor(QUEUE_SIMPLE_EVENT)
export class EventProcessor {
  private readonly logger = new Logger(EventProcessor.name);

  constructor(private eventService: EventService) {}

  async processSimpleEvent(job: Job<SimpleEventData>) {
    this.logger.log(`[processSimpleEvent] job: ${JSON.stringify(job)}`);

    await this.eventService.handleSimpleEvent(job.data);
  }
}
