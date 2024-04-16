import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

@Injectable()
export class MinioService extends Client implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);

  constructor(private configService: ConfigService) {
    super({
      endPoint: configService.getOrThrow('minio.endpoint'),
      port: configService.getOrThrow('minio.port'),
      useSSL: configService.getOrThrow('minio.useSSL') === 'true',
      accessKey: configService.getOrThrow('minio.accessKey'),
      secretKey: configService.getOrThrow('minio.secretKey'),
    });
  }

  async ensureBucketExists(bucket: string) {
    const exists = await this.bucketExists(bucket);
    if (exists) {
      this.logger.log('Bucket ' + bucket + ' exists');
    } else {
      await this.makeBucket(bucket);
      this.logger.log('Bucket ' + bucket + ' created');
    }
  }

  async onModuleInit() {
    await this.ensureBucketExists(
      this.configService.getOrThrow('minio.weblinkBucket'),
    );
  }
}
