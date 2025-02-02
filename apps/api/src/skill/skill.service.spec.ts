import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';
import { PrismaService } from '@/common/prisma.service';
import { SkillService } from './skill.service';
import { Queue } from 'bullmq';
import { CommonModule } from '@/common/common.module';
import { LabelModule } from '@/label/label.module';

describe('SkillService', () => {
  let service: SkillService;

  const mockQueue = {
    add: jest.fn(),
  } as unknown as Queue;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, CommonModule, LabelModule],
      providers: [
        SkillService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'skill.executionTimeout':
                  return 300000; // 5 minutes
                case 'skill.idleTimeout':
                  return 60000; // 1 minute
                default:
                  return null;
              }
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
            },
            skillInstance: {
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: getQueueToken('skill'),
          useValue: mockQueue,
        },
        {
          provide: getQueueToken('skill_timeout_check'),
          useValue: mockQueue,
        },
        {
          provide: getQueueToken('sync_token_usage'),
          useValue: mockQueue,
        },
        {
          provide: getQueueToken('sync_request_usage'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<SkillService>(SkillService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more test cases here as needed
});
