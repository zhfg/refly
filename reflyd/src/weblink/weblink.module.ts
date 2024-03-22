import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';

import { WeblinkController } from './weblink.controller';
import { WeblinkService } from './weblink.service';

import { WeblinkProcessor } from './weblink.processor';
import { LlmModule } from '../llm/llm.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    ConfigModule,
    CommonModule,
    LlmModule,
    BullModule.registerQueue({ name: 'index' }),
  ],
  controllers: [WeblinkController],
  providers: [WeblinkService, WeblinkProcessor],
  exports: [WeblinkService],
})
export class WeblinkModule {}
