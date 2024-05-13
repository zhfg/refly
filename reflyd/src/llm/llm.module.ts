import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmService } from './llm.service';
import { CommonModule } from '../common/common.module';
import { RAGModule } from '../rag/rag.module';

@Module({
  imports: [ConfigModule, CommonModule, RAGModule],
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
