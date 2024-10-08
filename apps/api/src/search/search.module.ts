import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SearchService } from './search.service';
import { CommonModule } from '@/common/common.module';
import { SearchController } from './search.controller';
import { RAGModule } from '@/rag/rag.module';

@Module({
  imports: [ConfigModule, CommonModule, RAGModule],
  providers: [SearchService],
  controllers: [SearchController],
  exports: [SearchService],
})
export class SearchModule {}
