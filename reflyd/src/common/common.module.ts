import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { MinioService } from './minio.service';
import { PuppeteerService } from './puppeteer.service';
import { RedisService } from './redis.service';
import { QdrantService } from './qdrant.service';

@Module({
  imports: [ConfigModule],
  providers: [PrismaService, RedisService, MinioService, QdrantService, PuppeteerService],
  exports: [PrismaService, RedisService, MinioService, QdrantService, PuppeteerService],
})
export class CommonModule {}
