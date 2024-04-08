import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';

import { WeblinkController } from './weblink.controller';
import { WeblinkService } from './weblink.service';

import { WeblinkProcessor } from './weblink.processor';
import { CommonModule } from '../common/common.module';
import { AigcModule } from '../aigc/aigc.module';
import { QUEUE_STORE_LINK } from '../utils/const';

@Module({
  imports: [
    ConfigModule,
    CommonModule,
    AigcModule,
    BullModule.registerQueue({ name: QUEUE_STORE_LINK }),
  ],
  controllers: [WeblinkController],
  providers: [WeblinkService, WeblinkProcessor],
  exports: [WeblinkService],
})
export class WeblinkModule {}
