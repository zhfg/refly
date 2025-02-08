import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MiscController } from './misc.controller';
import { MiscService } from './misc.service';
import { CommonModule } from '@/common/common.module';
import { QUEUE_SYNC_STORAGE_USAGE, QUEUE_IMAGE_PROCESSING } from '@/utils';
import { ImageProcessor } from '@/misc/misc.processor';

@Module({
  imports: [
    CommonModule,
    BullModule.registerQueue({ name: QUEUE_SYNC_STORAGE_USAGE }),
    BullModule.registerQueue({ name: QUEUE_IMAGE_PROCESSING }),
  ],
  controllers: [MiscController],
  providers: [MiscService, ImageProcessor],
  exports: [MiscService],
})
export class MiscModule {}
