import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { CommonModule } from '@/common/common.module';
import { BullModule } from '@nestjs/bull';
import { QUEUE_EVENT } from '@/utils';

@Module({
  imports: [CommonModule, BullModule.registerQueue({ name: QUEUE_EVENT })],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
