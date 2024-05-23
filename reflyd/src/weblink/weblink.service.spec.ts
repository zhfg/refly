import { Test, TestingModule } from '@nestjs/testing';
import { WeblinkService } from './weblink.service';
import { CommonModule } from '../common/common.module';
import { ConfigModule } from '@nestjs/config';
import { RAGModule } from '../rag/rag.module';
import { AigcModule } from '../aigc/aigc.module';
import { BullModule } from '@nestjs/bull';
import { QUEUE_WEBLINK } from '../utils/const';
import configuration from '../config/app.config';

describe('WeblinkService', () => {
  let service: WeblinkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [configuration] }),
        CommonModule,
        RAGModule,
        AigcModule,
        BullModule.registerQueue({ name: QUEUE_WEBLINK }),
      ],
      providers: [WeblinkService],
    }).compile();

    service = module.get<WeblinkService>(WeblinkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('saveChunkEmbeddingsForUser should work', async () => {
    await service.saveChunkEmbeddingsForUser(
      {
        id: 1,
        uid: 'u-s9h25bshm6yx2m5fktbcrcrh',
      },
      ['https://mp.weixin.qq.com/s/FbHTyHqEBJT-1PhA5x7FRg'],
    );
  });
});
