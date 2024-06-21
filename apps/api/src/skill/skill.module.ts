import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { SkillService } from './skill.service';
import { SkillController } from './skill.controller';
import { CommonModule } from 'src/common/common.module';
import { QUEUE_SKILL } from 'src/utils';

@Module({
  imports: [CommonModule, ConfigModule, BullModule.registerQueue({ name: QUEUE_SKILL })],
  providers: [SkillService],
  controllers: [SkillController],
})
export class SkillModule {}
