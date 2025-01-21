import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CanvasController } from './canvas.controller';
import { CanvasService } from './canvas.service';
import { ClearCanvasEntityProcessor, SyncCanvasEntityProcessor } from './canvas.processor';
import { CollabModule } from '@/collab/collab.module';
import { QUEUE_CLEAR_CANVAS_ENTITY, QUEUE_SYNC_CANVAS_ENTITY } from '@/utils/const';
import { CommonModule } from '@/common/common.module';
import { MiscModule } from '@/misc/misc.module';

@Module({
  imports: [
    CommonModule,
    CollabModule,
    MiscModule,
    BullModule.registerQueue({
      name: QUEUE_SYNC_CANVAS_ENTITY,
    }),
    BullModule.registerQueue({
      name: QUEUE_CLEAR_CANVAS_ENTITY,
    }),
  ],
  controllers: [CanvasController],
  providers: [CanvasService, SyncCanvasEntityProcessor, ClearCanvasEntityProcessor],
  exports: [CanvasService],
})
export class CanvasModule {}
