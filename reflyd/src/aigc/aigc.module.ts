import { Module } from '@nestjs/common';
import { AigcController } from './aigc.controller';
import { AigcService } from './aigc.service';
import { CommonModule } from '../common/common.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [CommonModule, LlmModule],
  controllers: [AigcController],
  providers: [AigcService],
  exports: [AigcService],
})
export class AigcModule {}
