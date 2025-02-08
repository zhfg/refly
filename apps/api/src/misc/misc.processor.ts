import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QUEUE_IMAGE_PROCESSING } from '@/utils/const';
import { MiscService } from '@/misc/misc.service';
import { ImageProcessingJobData } from '@/misc/misc.dto';

@Processor(QUEUE_IMAGE_PROCESSING)
export class ImageProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageProcessor.name);

  constructor(private miscService: MiscService) {
    super();
  }

  async process(job: Job<ImageProcessingJobData>): Promise<void> {
    const { storageKey } = job.data;
    try {
      await this.miscService.processImage(storageKey);
      this.logger.log(`Successfully processed image for key ${storageKey}`);
    } catch (error) {
      this.logger.error(`Error processing image: ${error instanceof Error ? error.stack : error}`);
      throw error;
    }
  }
}
