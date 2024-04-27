import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { MinioService } from './minio.service';
import { WeaviateService } from './weaviate.service';
import { PuppeteerService } from './puppeteer.service';

@Module({
  imports: [ConfigModule],
  providers: [PrismaService, MinioService, WeaviateService, PuppeteerService],
  exports: [PrismaService, MinioService, WeaviateService, PuppeteerService],
})
export class CommonModule {}
