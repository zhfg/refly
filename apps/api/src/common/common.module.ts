import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { MinioService } from './minio.service';
import { RedisService } from './redis.service';
import { QdrantService } from './qdrant.service';
import { EventModule } from '@/event/event.module';

@Module({
  // imports: [ConfigModule, forwardRef(() => EventModule)],
  imports: [ConfigModule],
  providers: [PrismaService, RedisService, MinioService, QdrantService],
  exports: [PrismaService, RedisService, MinioService, QdrantService],
})
export class CommonModule {}
