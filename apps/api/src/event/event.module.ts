import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { CommonModule } from '@/common/common.module';
import { BullModule } from '@nestjs/bull';
import { QUEUE_SKILL } from '@/utils';
import { EventProcessor } from './event.processor';

@Module({
  imports: [CommonModule, BullModule.registerQueue({ name: QUEUE_SKILL })],
  providers: [EventService, EventProcessor],
  exports: [EventService],
})
export class EventModule {}
