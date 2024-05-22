import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { streamToBuffer } from 'src/utils';

@Injectable()
export class MinioService implements OnModuleInit {
  private client: Client;
  private bucketName: string;
  private readonly logger = new Logger(MinioService.name);

  constructor(private configService: ConfigService) {
    this.client = new Client({
      endPoint: configService.getOrThrow('minio.endpoint'),
      port: configService.getOrThrow('minio.port'),
      useSSL: configService.getOrThrow('minio.useSSL') === 'true',
      accessKey: configService.getOrThrow('minio.accessKey'),
      secretKey: configService.getOrThrow('minio.secretKey'),
    });
    this.bucketName = configService.getOrThrow('minio.weblinkBucket');
  }

  async ensureBucketExists(bucket: string) {
    const exists = await this.client.bucketExists(bucket);
    if (exists) {
      this.logger.log('Bucket ' + bucket + ' exists');
    } else {
      await this.client.makeBucket(bucket);
      this.logger.log('Bucket ' + bucket + ' created');
    }
  }

  async onModuleInit() {
    await this.ensureBucketExists(this.configService.getOrThrow('minio.weblinkBucket'));
  }

  async downloadData(key: string) {
    const stream = await this.client.getObject(this.bucketName, key);
    return streamToBuffer(stream);
  }

  async uploadData(key: string, data: string | Buffer) {
    return this.client.putObject(this.bucketName, key, data);
  }
}
