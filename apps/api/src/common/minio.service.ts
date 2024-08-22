import { MinioConfig } from '@/config/app.config';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client as MinioClient } from 'minio';

// Internal object storage, which is private and only consumed by api server
export const MINIO_INTERNAL = 'minio-internal';

// External object storage, which is typically public and allow anonymous access
export const MINIO_EXTERNAL = 'minio-external';

@Injectable()
export class MinioService extends MinioClient implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);

  constructor(@Inject('MINIO_CONFIG') private config: MinioConfig) {
    super({
      endPoint: config.endPoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });
  }

  async onModuleInit() {
    const exists = await this.bucketExists(this.config.bucket);
    if (exists) {
      this.logger.log('Bucket ' + this.config.bucket + ' exists');
    } else {
      await this.makeBucket(this.config.bucket);
      this.logger.log('Bucket ' + this.config.bucket + ' created');
    }
  }

  bucketName() {
    return this.config.bucket;
  }
}
