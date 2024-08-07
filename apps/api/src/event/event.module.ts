import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { CommonModule } from '@/common/common.module';
import { SkillModule } from '@/skill/skill.module';
import { BullModule } from '@nestjs/bull';
import { QUEUE_EVENT } from '@/utils';
import { EventProcessor } from './event.processor';

@Module({
  imports: [CommonModule, SkillModule, BullModule.registerQueue({ name: QUEUE_EVENT })],
  providers: [EventService, EventProcessor],
  exports: [EventService],
})
export class EventModule {}
