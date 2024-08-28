import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { MINIO_EXTERNAL, MINIO_INTERNAL, MinioService } from './minio.service';
import { RedisService } from './redis.service';
import { QdrantService } from './qdrant.service';

@Module({
  imports: [ConfigModule],
  providers: [
    PrismaService,
    RedisService,
    QdrantService,
    {
      provide: MINIO_INTERNAL,
      useFactory: (configService: ConfigService) =>
        new MinioService(configService.getOrThrow('minio.internal')),
      inject: [ConfigService],
    },
    {
      provide: MINIO_EXTERNAL,
      useFactory: (configService: ConfigService) =>
        new MinioService(configService.getOrThrow('minio.external')),
      inject: [ConfigService],
    },
  ],
  exports: [PrismaService, RedisService, QdrantService, MINIO_INTERNAL, MINIO_EXTERNAL],
})
export class CommonModule {}
