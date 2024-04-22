import { Test, TestingModule } from '@nestjs/testing';
import { RAGService } from './rag.service';

describe('RAGService', () => {
  let service: RAGService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RAGService],
    }).compile();

    service = module.get<RAGService>(RAGService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
