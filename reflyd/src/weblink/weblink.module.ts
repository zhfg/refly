import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';

import { WeblinkController } from './weblink.controller';
import { WeblinkService } from './weblink.service';
import { PrismaService } from '../prisma.service';

import { WeblinkProcessor } from './weblink.processor';
import { LlmService } from '../llm/llm.service';

@Module({
  imports: [ConfigModule, BullModule.registerQueue({ name: 'index' })],
  controllers: [WeblinkController],
  providers: [WeblinkService, WeblinkProcessor, PrismaService, LlmService],
})
export class WeblinkModule {}
