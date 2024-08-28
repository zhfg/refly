import { Inject, Injectable, StreamableFile } from '@nestjs/common';
import { ScrapeWeblinkRequest, ScrapeWeblinkResult, UploadResponse } from '@refly/openapi-schema';
import { safeParseURL } from '@refly/utils';
import { load } from 'cheerio';
import { MINIO_EXTERNAL, MinioService } from '@/common/minio.service';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MiscService {
  constructor(private config: ConfigService, @Inject(MINIO_EXTERNAL) private minio: MinioService) {}

  async scrapeWeblink(body: ScrapeWeblinkRequest): Promise<ScrapeWeblinkResult> {
    const { url } = body;
    const res = await fetch(url);
    const html = await res.text();
    const $ = load(html);

    // Get OG title
    const title = $('meta[property="og:title"]').attr('content') || $('title').text();

    // Get OG description
    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content');

    // Get OG image or first suitable image
    let image = $('meta[property="og:image"]').attr('content');
    if (!image) {
      // If no og:image exists, pick the first image starts with http or https
      $('img').each((index, element) => {
        const src = $(element).attr('src');
        if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
          image = src;
          return false; // break forEach loop
        }
      });
    }
    if (!image) {
      const domain = safeParseURL(url);
      image = `https://www.google.com/s2/favicons?domain=${domain}&sz=${16}`;
    }

    return {
      title,
      description,
      image,
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
