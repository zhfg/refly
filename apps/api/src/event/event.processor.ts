import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import { EventService } from './event.service';
import { ReportEventData } from './event.dto';
import { CHANNEL_REPORT_EVENT, QUEUE_EVENT } from '@/utils/const';

@Processor(QUEUE_EVENT)
export class EventProcessor {
  private readonly logger = new Logger(EventProcessor.name);

  constructor(private eventService: EventService) {}

  @Process(CHANNEL_REPORT_EVENT)
  async processReportEvent(job: Job<ReportEventData>) {
    this.logger.log(`[processReportEvent] job: ${JSON.stringify(job)}`);

    await this.eventService.handleEvent(job.data);
  }
}
