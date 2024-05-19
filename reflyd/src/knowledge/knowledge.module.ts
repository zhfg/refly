import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { CommonModule } from '../common/common.module';
import { WeblinkModule } from '../weblink/weblink.module';

@Module({
  imports: [CommonModule, ConfigModule, WeblinkModule],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
})
export class KnowledgeModule {}
