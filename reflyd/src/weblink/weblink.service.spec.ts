import { Test, TestingModule } from '@nestjs/testing';
import { WeblinkService } from './weblink.service';

describe('WeblinkService', () => {
  let service: WeblinkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WeblinkService],
    }).compile();

    service = module.get<WeblinkService>(WeblinkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
