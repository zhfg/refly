import { Module } from '@nestjs/common';
import { AigcController } from './aigc.controller';

@Module({
  controllers: [AigcController],
})
export class AigcModule {}
