import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Prisma, Resource, User, Weblink } from '@prisma/client';
import _ from 'lodash';
import { PrismaService } from '../common/prisma.service';
import { MinioService } from '../common/minio.service';
import { WeblinkService } from '../weblink/weblink.service';
import {
  CollectionDetail,
  UpsertCollectionRequest,
  UpsertResourceRequest,
  QueryResourceParam,
  ResourceDetail,
  WeblinkMeta,
  CollectionListItem,
} from './knowledge.dto';
import {
  CHANNEL_FINALIZE_RESOURCE,
  QUEUE_RESOURCE,
  genCollectionID,
  genResourceID,
  genResourceUuid,
} from 'src/utils';
import { ConfigService } from '@nestjs/config';
import { RAGService } from 'src/rag/rag.service';

@Injectable()
export class KnowledgeService {
  private logger = new Logger(KnowledgeService.name);

  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
    private config: ConfigService,
    private ragService: RAGService,
    private weblinkService: WeblinkService,
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
        ..._.omit(r, ['id', 'deletedAt']),
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
      const weblinkMeta = JSON.parse(resource.meta) as WeblinkMeta;
      const buf = await this.minio.downloadData(weblinkMeta.storageKey);
      detail.doc = this.ragService.convertHTMLToMarkdown('render', buf.toString());
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
    const { url, linkId, storageKey, title } = param.data;

    let weblink: Weblink;
    if (param.data?.linkId) {
      weblink = await this.weblinkService.findFirstWeblink({ url, linkId });
      if (!weblink) {
        this.logger.warn(`Weblink not found, url: ${url}, linkId: ${linkId}`);
        return;
      }
    } else {
      weblink = await this.weblinkService.processLink({ url, storageKey });
    }

    // TODO: 减少不必要的重复插入
    const { resourceId, collectionId } = param;
    const { doc, html } = await this.weblinkService.readWebLinkContent(url);

    // ensure the document is for ingestion use
    doc.pageContent = this.ragService.convertHTMLToMarkdown('ingest', html);

    const chunks = await this.ragService.indexContent(doc);

    chunks.forEach((chunk, index) => {
      chunk.id = genResourceUuid(`${resourceId}-${index}`);
      chunk.resourceId = resourceId;
      chunk.collectionId = collectionId;
    });

    await this.ragService.saveDataForUser(user, { chunks });

    this.logger.log(
      `save resource segments for user ${
        user.uid
      } success, resourceId: ${resourceId}, weblink: ${JSON.stringify(weblink)}`,
    );

    await this.prisma.resource.update({
      where: { resourceId, userId: user.id },
      data: {
        indexStatus: 'finish',
        meta: JSON.stringify({
          url,
          linkId: weblink.linkId,
          title: title,
          storageKey: storageKey || weblink.storageKey,
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
