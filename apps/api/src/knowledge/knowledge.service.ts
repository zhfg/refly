import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { readingTime } from 'reading-time-estimator';
import { Prisma, Resource, User } from '@prisma/client';
import _ from 'lodash';
import { RAGService } from '../rag/rag.service';
import { PrismaService } from '../common/prisma.service';
import { MinioService } from '../common/minio.service';
import {
  CollectionDetail,
  UpsertCollectionRequest,
  UpsertResourceRequest,
  QueryResourceParam,
  ResourceDetail,
  WeblinkMeta,
  CollectionListItem,
} from '@refly/schema';
import {
  CHANNEL_FINALIZE_RESOURCE,
  QUEUE_RESOURCE,
  cleanMarkdownForIngest,
  genCollectionID,
  genResourceID,
  genResourceUuid,
} from '../utils';

@Injectable()
export class KnowledgeService {
  private logger = new Logger(KnowledgeService.name);

  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
    private ragService: RAGService,
    @InjectQueue(QUEUE_RESOURCE) private queue: Queue<UpsertResourceRequest>,
  ) {}

  async listCollections(
    user: User,
    params: { page: number; pageSize: number },
  ): Promise<CollectionListItem[]> {
    const { page, pageSize } = params;
    return this.prisma.collection.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async getCollectionDetail(collectionId: string): Promise<CollectionDetail> {
    const data = await this.prisma.collection.findFirst({
      where: { collectionId, deletedAt: null },
      include: { resources: { orderBy: { updatedAt: 'desc' } } },
    });
    if (!data) {
      return null;
    }
    return {
      ..._.pick(data, [
        'collectionId',
        'userId',
        'title',
        'description',
        'isPublic',
        'createdAt',
        'updatedAt',
      ]),
      resources: data.resources.map((r) => ({
        ..._.omit(r, ['id', 'userId', 'deletedAt']),
        data: JSON.parse(r.meta),
      })),
    };
  }

  async upsertCollection(user: User, param: UpsertCollectionRequest): Promise<CollectionListItem> {
    if (!param.collectionId) {
      param.collectionId = genCollectionID();
    }

    const upserted = await this.prisma.collection.upsert({
      where: { collectionId: param.collectionId },
      create: {
        collectionId: param.collectionId,
        title: param.title,
        description: param.description,
        userId: user.id,
        isPublic: param.isPublic,
      },
      update: { ..._.omit(param, 'collectionId') },
    });

    return _.pick(upserted, [
      'collectionId',
      'title',
      'description',
      'isPublic',
      'createdAt',
      'updatedAt',
    ]);
  }

  async deleteCollection(user: User, collectionId: string) {
    const coll = await this.prisma.collection.findFirst({
      where: { collectionId, deletedAt: null },
    });
    if (!coll) {
      throw new BadRequestException('Collection not found');
    }
    if (coll.userId !== user.id) {
      throw new UnauthorizedException();
    }

    // TODO: delete resources

    return this.prisma.collection.update({
      where: { collectionId, userId: user.id },
      data: { deletedAt: new Date() },
    });
  }

  async listResources(param: QueryResourceParam): Promise<Resource[]> {
    const { collectionId, page = 1, pageSize = 10 } = param;

    // Query resources by collection
    if (collectionId) {
      const data = await this.prisma.collection.findMany({
        where: { collectionId, deletedAt: null },
        include: {
          resources: {
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { updatedAt: 'desc' },
          },
        },
      });
      return data.length > 0 ? data[0].resources : [];
    }

    const resources = await this.prisma.resource.findMany({
      where: { resourceId: param.resourceId, deletedAt: null },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
    });

    return resources.map((r) => ({
      ...r,
      data: JSON.parse(r.meta),
    }));
  }

  async getResourceDetail(resourceId: string, needDoc?: boolean): Promise<ResourceDetail> {
    const resource = await this.prisma.resource.findFirst({
      where: { resourceId, deletedAt: null },
    });
    const detail: ResourceDetail = {
      ..._.omit(resource, ['id']),
      data: JSON.parse(resource.meta),
    };

    if (needDoc) {
      const metadata = detail.data as WeblinkMeta;
      const buf = await this.minio.downloadData(resource.storageKey || metadata.storageKey);
      detail.doc = buf.toString();
    }

    return detail;
  }

  async createResource(user: User, param: UpsertResourceRequest) {
    param.resourceId = genResourceID();

    // If target collection not specified, create new one
    if (!param.collectionId) {
      param.collectionId = genCollectionID();
      this.logger.log(
        `create new collection for user ${user.uid}, collection id: ${param.collectionId}`,
      );
    }

    if (param.resourceType === 'weblink') {
      if (!param.data) {
        throw new BadRequestException('data is required');
      }
      const { url, linkId, title } = param.data;
      if (!url && !linkId) {
        throw new BadRequestException('url or linkId is required');
      }
      param.title ||= title;
    } else {
      throw new BadRequestException('Invalid resource type');
    }

    const res = await this.prisma.resource.create({
      data: {
        resourceId: param.resourceId,
        resourceType: param.resourceType,
        meta: JSON.stringify(param.data),
        storageKey: param.storageKey,
        userId: user.id,
        isPublic: param.isPublic,
        title: param.title || 'Untitled',
        indexStatus: 'processing',
        collections: {
          connectOrCreate: {
            where: { collectionId: param.collectionId },
            create: {
              title: param.collectionName || 'Default Collection',
              userId: user.id,
              collectionId: param.collectionId,
            },
          },
        },
      },
    });

    await this.queue.add(CHANNEL_FINALIZE_RESOURCE, param);
    // await this.finalizeResource(param);

    return res;
  }

  async indexResource(user: User, param: UpsertResourceRequest) {
    const { resourceId, collectionId } = param;
    const { url, linkId, storageKey, title } = param.data;
    param.storageKey ||= storageKey;

    if (!param.storageKey && linkId) {
      const weblink = await this.prisma.weblink.findFirst({
        where: { linkId },
      });
      if (!weblink) {
        this.logger.warn(`weblink not found for linkId: ${linkId}, fallback to server crawl`);
      } else {
        param.storageKey = weblink.parsedDocStorageKey;
      }
    }

    if (!param.storageKey) {
      const { data } = await this.ragService.crawlFromRemoteReader(url);
      param.content = data.content;
      param.title ||= data.title;

      const resourceKey = `resource/${resourceId}`;
      const res = await this.minio.uploadData(resourceKey, param.content);
      param.storageKey = resourceKey;

      this.logger.log(`upload resource ${resourceKey} success, res: ${JSON.stringify(res)}`);
    } else {
      param.content = (await this.minio.downloadData(param.storageKey)).toString();
    }

    // TODO: 减少不必要的重复插入

    // ensure the document is for ingestion use
    const chunks = await this.ragService.indexContent({
      pageContent: cleanMarkdownForIngest(param.content),
      metadata: { url, title },
    });

    chunks.forEach((chunk, index) => {
      chunk.id = genResourceUuid(`${resourceId}-${index}`);
      chunk.resourceId = resourceId;
      chunk.collectionId = collectionId;
    });

    await this.ragService.saveDataForUser(user, { chunks });

    this.logger.log(
      `save resource segments for user ${user.uid} success, resourceId: ${resourceId}`,
    );

    await this.prisma.resource.update({
      where: { resourceId, userId: user.id },
      data: {
        storageKey: storageKey,
        wordCount: readingTime(param.content).words,
        indexStatus: 'finish',
        meta: JSON.stringify({
          url,
          title: param.title,
          storageKey: param.storageKey,
        } as WeblinkMeta),
      },
    });
  }

  /**
   * Process resource after inserted, including connecting with weblink and
   * save to vector store.
   */
  async finalizeResource(param: UpsertResourceRequest) {
    const user = await this.prisma.user.findFirst({ where: { id: param.userId } });
    if (!user) {
      this.logger.warn(`User not found, userId: ${param.userId}`);
      return;
    }

    try {
      await this.indexResource(user, param);
    } catch (err) {
      console.error(err);
      this.logger.error(`finalize resource error: ${err}`);
      await this.prisma.resource.update({
        where: { resourceId: param.resourceId, userId: user.id },
        data: { indexStatus: 'failed' },
      });
      throw err;
    }
  }

  async updateResource(user: User, param: UpsertResourceRequest) {
    const updates: Prisma.ResourceUpdateInput = _.pick(param, ['title', 'isPublic']);
    if (param.data) {
      updates.meta = JSON.stringify(param.data);
    }
    return this.prisma.resource.update({
      where: { resourceId: param.resourceId, userId: user.id },
      data: updates,
    });
  }

  async deleteResource(user: User, resourceId: string) {
    const resource = await this.prisma.resource.findFirst({
      where: { resourceId, deletedAt: null },
    });
    if (!resource) {
      throw new BadRequestException('Resource not found');
    }
    if (resource.userId !== user.id) {
      throw new UnauthorizedException();
    }

    return Promise.all([
      this.ragService.deleteResourceData(user, resourceId),
      this.prisma.resource.update({
        where: { resourceId },
        data: { deletedAt: new Date() },
      }),
    ]);
  }
}
