import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { CanvasService } from './canvas.service';
import { QUEUE_SYNC_CANVAS_ENTITY } from '@/utils/const';

interface SyncCanvasEntityJobData {
  canvasId: string;
}

@Processor(QUEUE_SYNC_CANVAS_ENTITY)
export class SyncCanvasEntityProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncCanvasEntityProcessor.name);

  constructor(private canvasService: CanvasService) {
    super();
  }

  async process(job: Job<SyncCanvasEntityJobData>) {
    this.logger.log(`[${QUEUE_SYNC_CANVAS_ENTITY}] job: ${JSON.stringify(job)}`);

    try {
      await this.canvasService.syncCanvasEntityRelation(job.data.canvasId);
    } catch (error) {
      this.logger.error(`[${QUEUE_SYNC_CANVAS_ENTITY}] error: ${error?.stack}`);
      throw error;
    }
  }
}
