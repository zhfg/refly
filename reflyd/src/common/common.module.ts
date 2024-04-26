import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { LoggerService } from './logger.service';
import { MinioService } from './minio.service';
import { WeaviateService } from './weaviate.service';
import { PuppeteerService } from './puppeteer.service';

@Module({
  imports: [ConfigModule],
  providers: [PrismaService, MinioService, LoggerService, WeaviateService, PuppeteerService],
  exports: [PrismaService, MinioService, LoggerService, WeaviateService, PuppeteerService],
})
export class CommonModule {}
