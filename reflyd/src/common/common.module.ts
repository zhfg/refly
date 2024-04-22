import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { LoggerService } from './logger.service';
import { MinioService } from './minio.service';
import { WeaviateService } from './weaviate.service';

@Module({
  imports: [ConfigModule],
  providers: [PrismaService, MinioService, LoggerService, WeaviateService],
  exports: [PrismaService, MinioService, LoggerService, WeaviateService],
})
export class CommonModule {}
