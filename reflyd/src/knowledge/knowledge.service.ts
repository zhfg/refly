import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Collection, Prisma, User } from '@prisma/client';
import _ from 'lodash';
import { PrismaService } from '../common/prisma.service';
import { MinioService } from '../common/minio.service';
import { WeblinkService } from '../weblink/weblink.service';
import {
  CollectionDetail,
  UpsertCollectionRequest,
  UpsertResourceRequest,
  QueryResourceParam,
  ResourceListItem,
  ResourceDetail,
  WeblinkMeta,
  CollectionListItem,
} from './knowledge.dto';
import { genCollectionID, genConvID, genResourceID, streamToString } from 'src/utils';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KnowledgeService {
  private logger = new Logger(KnowledgeService.name);

  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
    private config: ConfigService,
    private weblinkService: WeblinkService,
  ) {}

  async listCollections(user: User) {
    return this.prisma.collection.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getCollectionDetail(collectionId: string): Promise<CollectionDetail> {
    const data = await this.prisma.collection.findFirst({
      where: { collectionId, deletedAt: null },
      include: { resources: true },
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
    return this.prisma.collection.update({
      where: { collectionId, userId: user.id },
      data: { deletedAt: new Date() },
    });
  }

  async listResources(param: QueryResourceParam): Promise<ResourceListItem[]> {
    // TODO: support collection id query
    const resources = await this.prisma.resource.findMany({
      where: { resourceId: param.resourceId, deletedAt: null },
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
    const detail: ResourceDetail = { ...resource, data: JSON.parse(resource.meta) };

    if (needDoc) {
      const weblinkMeta = JSON.parse(resource.meta) as WeblinkMeta;
      const docStream = await this.minio.getObject(
        this.config.getOrThrow('minio.weblinkBucket'),
        weblinkMeta.parsedDocStorageKey,
      );
      detail.doc = await streamToString(docStream);
    }

    return detail;
  }

  async createResource(user: User, param: UpsertResourceRequest) {
    param.resourceId = genResourceID();

    if (param.resourceType === 'weblink') {
      if (!param.data) {
        throw new BadRequestException('data is required');
      }
      const { url, linkId } = param.data;
      if (!url && !linkId) {
        throw new BadRequestException('url or linkId is required');
      }
      if (param.data?.linkId) {
        const weblink = await this.weblinkService.findFirstWeblink({ url, linkId });
        if (!weblink) {
          throw new BadRequestException('Weblink not found');
        }
        param.data.storageKey = weblink.storageKey;
        param.data.parsedDocStorageKey = weblink.parsedDocStorageKey;
      }
    } else {
      throw new BadRequestException('Invalid resource type');
    }

    // If target collection not specified, try to save to default collection
    if (!param.collectionId) {
      const defaultColl = await this.prisma.collection.findFirst({
        where: { userId: user.id, isDefault: true },
      });

      // If default collection not exists, create new one
      if (!defaultColl) {
        param.collectionId = genCollectionID();
      }
    }

    return this.prisma.resource.create({
      data: {
        resourceId: genResourceID(),
        resourceType: param.resourceType,
        meta: JSON.stringify(param.data),
        userId: user.id,
        isPublic: param.isPublic,
        title: param.title,
        collections: {
          connectOrCreate: {
            where: { collectionId: param.collectionId },
            create: {
              title: 'Default Collection',
              userId: user.id,
              collectionId: param.collectionId,
            },
          },
        },
      },
    });
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
    return this.prisma.resource.update({
      where: { resourceId },
      data: { deletedAt: new Date() },
    });
  }
}
