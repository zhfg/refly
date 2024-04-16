import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { MinioService } from './minio.service';

@Module({
  imports: [ConfigModule],
  providers: [PrismaService, MinioService],
  exports: [PrismaService, MinioService],
})
export class CommonModule {}
