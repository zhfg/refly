import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { LlmService } from './llm.service';
import { WeblinkService } from '../weblink/weblink.service';
import { WeblinkModule } from '../weblink/weblink.module';

describe('LlmService', () => {
  let module: TestingModule;
  let service: LlmService;
  let weblinkService: WeblinkService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule, WeblinkModule],
      providers: [LlmService],
    }).compile();

    service = module.get<LlmService>(LlmService);
    weblinkService = module.get<WeblinkService>(WeblinkService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('extractContentMeta', async () => {
    const url = 'https://paulgraham.com/vcsqueeze.html';
    const doc = await weblinkService.parseWebLinkContent(url);
    const res = await service.extractContentMeta(doc);
    expect(res).toEqual({});
  });
});
