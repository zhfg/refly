import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SkillService } from './skill.service';
import { SkillController } from './skill.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule, ConfigModule],
  providers: [SkillService],
  controllers: [SkillController],
})
export class SkillModule {}
