import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../common/common.module';
import { RAGService } from './rag.service';
import { RagController } from './rag.controller';

@Module({
  imports: [ConfigModule, CommonModule],
  providers: [RAGService],
  exports: [RAGService],
  controllers: [RagController],
})
export class RAGModule {}
