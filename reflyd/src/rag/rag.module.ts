import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../common/common.module';
import { RAGService } from './rag.service';

@Module({
  imports: [ConfigModule, CommonModule],
  providers: [RAGService],
  exports: [RAGService],
})
export class RAGModule {}
