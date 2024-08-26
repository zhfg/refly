import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MiscController } from './misc.controller';
import { MiscService } from './misc.service';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [CommonModule, ConfigModule],
  controllers: [MiscController],
  providers: [MiscService],
  exports: [MiscService],
})
export class MiscModule {}
