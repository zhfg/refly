import { Injectable, Logger } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/common/prisma.service';
import {
  CollectionDetail,
  CreateCollectionParam,
  CreateResourceParam,
  QueryResourceParam,
  ResourceListItem,
} from './knowledge.dto';
import { genConvID, genResourceID } from 'src/utils';

@Injectable()
export class KnowledgeService {
  private logger = new Logger(KnowledgeService.name);

  constructor(private prisma: PrismaService) {}

  async listCollections(user: User) {
    return this.prisma.collection.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCollectionDetail(collectionId: string): Promise<CollectionDetail> {
    const data = await this.prisma.collection.findFirst({
      where: { collectionId },
      include: { resources: true },
    });
    return {
      ...data,
      resources: data.resources.map((r) => ({
        ...r,
        data: JSON.parse(r.meta),
      })),
    };
  }

  async createCollection(user: User, param: CreateCollectionParam) {
    return this.prisma.collection.create({
      data: {
        collectionId: genConvID(),
        title: param.title,
        description: param.description,
        userId: user.id,
        isPublic: false,
      },
    });
  }

  async listResources(param: QueryResourceParam): Promise<ResourceListItem[]> {
    // TODO: support collection id query
    const resources = await this.prisma.resource.findMany({
      where: { resourceId: param.resourceId },
    });
    return resources.map((r) => ({
      ...r,
      data: JSON.parse(r.meta),
    }));
  }

  async getResourceDetail(resourceId: string) {
    const resource = await this.prisma.resource.findFirst({
      where: { resourceId },
    });
    return resource;
  }

  async createResource(user: User, param: CreateResourceParam) {
    return this.prisma.resource.create({
      data: {
        resourceId: genResourceID(),
        resourceType: param.type,
        meta: JSON.stringify(param.data),
        userId: user.id,
        isPublic: false,
        title: param.data.title,
      },
    });
  }
}
