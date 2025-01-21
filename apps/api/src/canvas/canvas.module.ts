import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CanvasController } from './canvas.controller';
import { CanvasService } from './canvas.service';
import { CommonModule } from '@/common/common.module';
import { CollabModule } from '@/collab/collab.module';
import { MiscModule } from '@/misc/misc.module';
import { QUEUE_SYNC_CANVAS_ENTITY } from '@/utils/const';
import { SyncCanvasEntityProcessor } from './canvas.processor';

@Module({
  imports: [
    CommonModule,
    CollabModule,
    MiscModule,
    BullModule.registerQueue({
      name: QUEUE_SYNC_CANVAS_ENTITY,
    }),
  ],
  controllers: [CanvasController],
  providers: [CanvasService, SyncCanvasEntityProcessor],
  exports: [CanvasService],
})
export class CanvasModule {}
