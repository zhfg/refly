import { Test, TestingModule } from '@nestjs/testing';
import { AigcService } from './aigc.service';

describe('AigcService', () => {
  let service: AigcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AigcService],
    }).compile();

    service = module.get<AigcService>(AigcService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
