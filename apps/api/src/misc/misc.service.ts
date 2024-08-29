import { Inject, Injectable, StreamableFile } from '@nestjs/common';
import { ScrapeWeblinkRequest, ScrapeWeblinkResult, UploadResponse } from '@refly/openapi-schema';
import { MINIO_EXTERNAL, MinioService } from '@/common/minio.service';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { scrapeWeblink } from '@refly/utils';

@Injectable()
export class MiscService {
  constructor(private config: ConfigService, @Inject(MINIO_EXTERNAL) private minio: MinioService) {}

  async scrapeWeblink(body: ScrapeWeblinkRequest): Promise<ScrapeWeblinkResult> {
    const { url } = body;
    const result = await scrapeWeblink(url);

    return {
      title: result.title,
      description: result.description,
      image: result.image,
    };
  }

  async dumpFileFromURL(url: string): Promise<UploadResponse['data']> {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();

    return await this.uploadFile({
      buffer: Buffer.from(buffer),
      mimetype: res.headers.get('Content-Type') || 'application/octet-stream',
    });
  }

  async uploadFile(
    file: Pick<Express.Multer.File, 'buffer' | 'mimetype'>,
  ): Promise<UploadResponse['data']> {
    const objectKey = randomUUID();
    await this.minio.client.putObject(`static/${objectKey}`, file.buffer, {
      'Content-Type': file.mimetype,
    });
    return {
      url: `${this.config.get('staticEndpoint')}${objectKey}`,
    };
  }

  async getFileStream(objectKey: string): Promise<StreamableFile> {
    const data = await this.minio.client.getObject(`static/${objectKey}`);
    return new StreamableFile(data);
  }
}
