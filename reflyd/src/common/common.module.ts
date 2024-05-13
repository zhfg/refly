import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { MinioService } from './minio.service';
import { WeaviateService } from './weaviate.service';
import { PuppeteerService } from './puppeteer.service';
import { RedisService } from './redis.service';

@Module({
  imports: [ConfigModule],
  providers: [PrismaService, RedisService, MinioService, WeaviateService, PuppeteerService],
  exports: [PrismaService, RedisService, MinioService, WeaviateService, PuppeteerService],
})
export class CommonModule {}
