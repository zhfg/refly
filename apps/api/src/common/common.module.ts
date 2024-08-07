import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaProvider, PrismaService } from './prisma.service';
import { MinioService } from './minio.service';
import { RedisService } from './redis.service';
import { QdrantService } from './qdrant.service';
import { BullModule } from '@nestjs/bull';
import { QUEUE_EVENT } from '@/utils';

@Module({
  imports: [ConfigModule, BullModule.registerQueue({ name: QUEUE_EVENT })],
  providers: [PrismaProvider, RedisService, MinioService, QdrantService],
  exports: [PrismaService, RedisService, MinioService, QdrantService],
})
export class CommonModule {}
