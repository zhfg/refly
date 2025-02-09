import { Inject, Injectable, StreamableFile, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import sharp from 'sharp';
import { InjectQueue } from '@nestjs/bullmq';
import {
  EntityType,
  ScrapeWeblinkRequest,
  ScrapeWeblinkResult,
  UploadResponse,
  User,
} from '@refly-packages/openapi-schema';
import { PrismaService } from '@/common/prisma.service';
import { MINIO_EXTERNAL, MinioService } from '@/common/minio.service';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { scrapeWeblink } from '@refly-packages/utils';
import { QUEUE_IMAGE_PROCESSING, QUEUE_SYNC_STORAGE_USAGE, streamToBuffer } from '@/utils';
import { SyncStorageUsageJobData } from '@/subscription/subscription.dto';
import {
  CanvasNotFoundError,
  ParamsError,
  ResourceNotFoundError,
  DocumentNotFoundError,
} from '@refly-packages/errors';
import { ImageProcessingJobData } from '@/misc/misc.dto';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class MiscService {
  private logger = new Logger(MiscService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    @Inject(MINIO_EXTERNAL) private minio: MinioService,
    @InjectQueue(QUEUE_SYNC_STORAGE_USAGE) private ssuQueue: Queue<SyncStorageUsageJobData>,
    @InjectQueue(QUEUE_IMAGE_PROCESSING) private imageQueue: Queue<ImageProcessingJobData>,
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
      throw new ParamsError('Entity ID and type are required');
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
        throw new ResourceNotFoundError();
      }
    } else if (entityType === 'canvas') {
      const canvas = await this.prisma.canvas.findUnique({
        where: {
          canvasId: entityId,
          uid: user.uid,
          deletedAt: null,
        },
      });
      if (!canvas) {
        throw new CanvasNotFoundError();
      }
    } else if (entityType === 'document') {
      const document = await this.prisma.document.findUnique({
        where: {
          docId: entityId,
          uid: user.uid,
          deletedAt: null,
        },
      });
      if (!document) {
        throw new DocumentNotFoundError();
      }
    } else {
      throw new ParamsError(`Invalid entity type: ${entityType}`);
    }
  }

  async uploadFile(
    user: User,
    param: {
      file: Pick<Express.Multer.File, 'buffer' | 'mimetype'>;
      entityId?: string;
      entityType?: EntityType;
    },
  ): Promise<UploadResponse['data']> {
    const { file, entityId, entityType } = param;

    if (entityId && entityType) {
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
        contentType: file.mimetype,
      },
    });

    await this.minio.client.putObject(storageKey, file.buffer, {
      'Content-Type': file.mimetype,
    });

    await this.ssuQueue.add('syncStorageUsage', {
      uid: user.uid,
      timestamp: new Date(),
    });

    // Resize and convert to webp if it's an image
    if (file.mimetype?.startsWith('image/')) {
      await this.imageQueue.add('resizeAndConvert', { storageKey });
    }

    return {
      storageKey,
      url: `${this.config.get('staticEndpoint')}${storageKey}`,
    };
  }

  /**
   * Process an image by resizing it and converting to webp.
   * @param storageKey - The storage key of the image to process.
   */
  async processImage(storageKey: string): Promise<void> {
    if (!storageKey) {
      this.logger.warn('Missing required job data');
      return;
    }

    // Retrieve the original image from minio
    const stream = await this.minio.client.getObject(storageKey);
    const originalBuffer = await streamToBuffer(stream);

    // Get image metadata to calculate dimensions
    const metadata = await sharp(originalBuffer).metadata();
    const originalWidth = metadata?.width ?? 0;
    const originalHeight = metadata?.height ?? 0;

    // Calculate the current area and scaling factor
    const originalArea = originalWidth * originalHeight;
    const maxArea = this.config.get('image.maxArea');
    const scaleFactor = originalArea > maxArea ? Math.sqrt(maxArea / originalArea) : 1;

    const processedBuffer = await sharp(originalBuffer)
      .resize({
        width: Math.round(originalWidth * scaleFactor),
        height: Math.round(originalHeight * scaleFactor),
        fit: 'fill', // Use fill since we're calculating exact dimensions
      })
      .toFormat('webp')
      .toBuffer();

    // Generate a new processed key for the image
    const processedKey = `static-processed/${createId()}-${Date.now()}.webp`;

    // Upload the processed image to minio
    await this.minio.client.putObject(processedKey, processedBuffer, {
      'Content-Type': 'image/webp',
    });

    // Update the staticFile record with the new processedImageKey
    await this.prisma.staticFile.updateMany({
      where: { storageKey: storageKey },
      data: { processedImageKey: processedKey },
    });
  }

  /**
   * Remove all files associated with an entity.
   */
  async removeFilesByEntity(
    user: User,
    param: { entityId: string; entityType: EntityType },
  ): Promise<void> {
    const { entityId, entityType } = param;
    this.logger.log(`Start to remove files for entity ${entityId} of type ${entityType}`);

    const files = await this.prisma.staticFile.findMany({
      select: {
        storageKey: true,
      },
      where: {
        uid: user.uid,
        entityId,
        entityType,
        deletedAt: null,
      },
    });

    if (files.length > 0) {
      this.logger.log(`Files to remove: ${files.map((file) => file.storageKey).join(',')}`);

      await Promise.all([
        this.minio.client.removeObjects(files.map((file) => file.storageKey)),
        this.prisma.staticFile.updateMany({
          where: {
            uid: user.uid,
            entityId,
            entityType,
          },
          data: {
            deletedAt: new Date(),
          },
        }),
      ]);
    }
  }

  async compareAndRemoveFiles(
    user: User,
    param: { entityId: string; entityType: EntityType; objectKeys: string[] },
  ): Promise<void> {
    const { entityId, entityType, objectKeys } = param;
    const storageKeys = objectKeys.map((key) => `static/${key}`);
    const files = await this.prisma.staticFile.findMany({
      select: {
        storageKey: true,
      },
      where: {
        uid: user.uid,
        entityId,
        entityType,
        deletedAt: null,
      },
    });
    const currentStorageKeys = files.map((file) => file.storageKey);
    const storageKeysToRemove = currentStorageKeys.filter((key) => !storageKeys.includes(key));

    await this.minio.client.removeObjects(storageKeysToRemove);
    this.logger.log(`Compare and remove files: ${storageKeysToRemove.join(',')}`);

    if (storageKeysToRemove.length > 0) {
      await this.prisma.staticFile.updateMany({
        where: {
          uid: user.uid,
          entityId,
          entityType,
          storageKey: {
            in: storageKeysToRemove,
          },
        },
        data: {
          deletedAt: new Date(),
        },
      });
    }
  }

  async getFileStream(objectKey: string): Promise<StreamableFile> {
    const data = await this.minio.client.getObject(`static/${objectKey}`);
    return new StreamableFile(data);
  }

  /**
   * Generates image URLs based on storage keys and configured payload mode
   * @param storageKeys - Array of storage keys for the images
   * @returns Array of URLs (either base64 or regular URLs depending on config)
   */
  async generateImageUrls(user: User, storageKeys: string[]): Promise<string[]> {
    if (!Array.isArray(storageKeys) || storageKeys.length === 0) {
      return [];
    }

    let imageMode = this.config.get('image.payloadMode');
    if (imageMode === 'url' && !this.config.get('staticEndpoint')) {
      this.logger.warn('Static endpoint is not configured, fallback to base64 mode');
      imageMode = 'base64';
    }

    this.logger.log(`Generating image URLs in ${imageMode} mode for ${storageKeys.length} images`);

    const files = await this.prisma.staticFile.findMany({
      select: {
        storageKey: true,
        processedImageKey: true,
      },
      where: {
        uid: user.uid,
        storageKey: { in: storageKeys },
      },
    });

    try {
      if (imageMode === 'base64') {
        const urls = await Promise.all(
          files.map(async (file) => {
            const storageKey = file.processedImageKey || file.storageKey;

            try {
              const data = await this.minio.client.getObject(storageKey);
              const chunks: Buffer[] = [];

              for await (const chunk of data) {
                chunks.push(chunk);
              }

              const buffer = Buffer.concat(chunks);
              const base64 = buffer.toString('base64');
              const contentType = await this.minio.client
                .statObject(storageKey)
                .then((stat) => stat.metaData?.['content-type'] ?? 'image/jpeg');

              return `data:${contentType};base64,${base64}`;
            } catch (error) {
              this.logger.error(`Failed to generate base64 for key ${storageKey}: ${error.stack}`);
              return '';
            }
          }),
        );
        return urls.filter(Boolean);
      }

      // URL mode
      const staticEndpoint = this.config.get('staticEndpoint') ?? '';
      return files.map((file) => {
        const storageKey = file.processedImageKey || file.storageKey;
        return `${staticEndpoint}static/${storageKey}`;
      });
    } catch (error) {
      this.logger.error('Error generating image URLs:', error);
      return [];
    }
  }
}
