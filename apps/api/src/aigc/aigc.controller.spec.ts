import { Test, TestingModule } from '@nestjs/testing';
import { AigcController } from './aigc.controller';

describe('AigcController', () => {
  let controller: AigcController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AigcController],
    }).compile();

    controller = module.get<AigcController>(AigcController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
