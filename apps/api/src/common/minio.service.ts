import { MinioConfig } from '@/config/app.config';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client as MinioClient } from 'minio';

// Internal object storage, which is private and only consumed by api server
export const MINIO_INTERNAL = 'minio-internal';

// External object storage, which is typically public and allow anonymous access
export const MINIO_EXTERNAL = 'minio-external';

type ProxiedMinioClient = {
  [K in keyof MinioClient]: MinioClient[K] extends (bucket: string, ...args: infer P) => infer R
    ? (...args: P) => R
    : MinioClient[K];
};

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private _client: MinioClient;
  private proxiedClient: ProxiedMinioClient;

  constructor(@Inject('MINIO_CONFIG') private config: MinioConfig) {
    this._client = new MinioClient({
      endPoint: config.endPoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });

    this.proxiedClient = new Proxy(this._client, {
      get: (target, prop: keyof MinioClient) => {
        const value = target[prop];
        if (typeof value === 'function') {
          return (...args: any[]) => {
            if (value.length > args.length) {
              return value.call(target, this.config.bucket, ...args);
            }
            return value.call(target, ...args);
          };
        }
        return value;
      },
    }) as unknown as ProxiedMinioClient;
  }

  async onModuleInit() {
    const exists = await this._client.bucketExists(this.config.bucket);
    if (exists) {
      this.logger.log(`Bucket ${this.config.bucket} exists`);
    } else {
      await this._client.makeBucket(this.config.bucket);
      this.logger.log(`Bucket ${this.config.bucket} created`);
    }
  }

  // Expose the bucketless client
  get client(): ProxiedMinioClient {
    return this.proxiedClient;
  }
}
