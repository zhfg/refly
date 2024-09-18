import { BadRequestException, Inject, Injectable, StreamableFile } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import {
  EntityType,
  ScrapeWeblinkRequest,
  ScrapeWeblinkResult,
  UploadResponse,
  User,
} from '@refly/openapi-schema';
import { PrismaService } from '@/common/prisma.service';
import { MINIO_EXTERNAL, MinioService } from '@/common/minio.service';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { scrapeWeblink } from '@refly/utils';
import { QUEUE_SYNC_STORAGE_USAGE } from '@/utils';
import { SyncStorageUsageJobData } from '@/subscription/subscription.dto';

@Injectable()
export class MiscService {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    @Inject(MINIO_EXTERNAL) private minio: MinioService,
    @InjectQueue(QUEUE_SYNC_STORAGE_USAGE) private ssuQueue: Queue<SyncStorageUsageJobData>,
  ) {}

  async scrapeWeblink(body: ScrapeWeblinkRequest): Promise<ScrapeWeblinkResult> {
    const { url } = body;
    const result = await scrapeWeblink(url);

    return {
      title: result.title,
      description: result.description,
      image: result.image,
    };
  }

  async dumpFileFromURL(user: User, url: string): Promise<UploadResponse['data']> {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();

    return await this.uploadFile(user, {
      file: {
        buffer: Buffer.from(buffer),
        mimetype: res.headers.get('Content-Type') || 'application/octet-stream',
      },
    });
  }

  async checkEntity(user: User, entityId: string, entityType: EntityType): Promise<void> {
    if (!entityId || !entityType) {
      throw new BadRequestException('Entity ID and type are required');
    }

    if (entityType === 'resource') {
      const resource = await this.prisma.resource.findUnique({
        where: {
          resourceId: entityId,
          uid: user.uid,
          deletedAt: null,
        },
      });
      if (!resource) {
        throw new BadRequestException('Resource not found');
      }
    } else if (entityType === 'collection') {
      const collection = await this.prisma.collection.findUnique({
        where: {
          collectionId: entityId,
          uid: user.uid,
          deletedAt: null,
        },
      });
      if (!collection) {
        throw new BadRequestException('Collection not found');
      }
    } else if (entityType === 'note') {
      const note = await this.prisma.note.findUnique({
        where: {
          noteId: entityId,
          uid: user.uid,
          deletedAt: null,
        },
      });
      if (!note) {
        throw new BadRequestException('Note not found');
      }
    } else {
      throw new BadRequestException('Invalid entity type');
    }
  }

  async uploadFile(
    user: User,
    param: {
      file: Pick<Express.Multer.File, 'buffer' | 'mimetype'>;
      entityId?: string;
      entityType?: EntityType;
    },
    enforceEntityCheck?: boolean,
  ): Promise<UploadResponse['data']> {
    const { file, entityId, entityType } = param;

    if (enforceEntityCheck) {
      await this.checkEntity(user, entityId, entityType);
    }

    const objectKey = randomUUID();
    const storageKey = `static/${objectKey}`;

    await this.prisma.staticFile.create({
      data: {
        uid: user.uid,
        storageKey,
        storageSize: file.buffer.length,
        entityId,
        entityType,
      },
    });

    await this.minio.client.putObject(storageKey, file.buffer, {
      'Content-Type': file.mimetype,
    });

    await this.ssuQueue.add({
      uid: user.uid,
      timestamp: new Date(),
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
