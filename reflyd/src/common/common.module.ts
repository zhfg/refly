import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { LoggerService } from './logger.service';
import { MinioService } from './minio.service';

@Module({
  imports: [ConfigModule],
  providers: [PrismaService, MinioService, LoggerService],
  exports: [PrismaService, MinioService, LoggerService],
})
export class CommonModule {}
