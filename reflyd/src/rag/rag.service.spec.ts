import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import { RAGService } from './rag.service';
import configuration from '../config/app.config';
import { CommonModule } from '../common/common.module';

describe('RAGService', () => {
  let service: RAGService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [configuration] }), CommonModule],
      providers: [RAGService],
    }).compile();

    service = module.get<RAGService>(RAGService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('crawl should work', async () => {
    const doc = await service.crawl('https://mp.weixin.qq.com/s/FbHTyHqEBJT-1PhA5x7FRg');
    expect(doc).toEqual({});
  });
});
