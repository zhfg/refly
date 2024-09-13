import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Queue } from 'bull';
import pLimit from 'p-limit';
import { InjectQueue } from '@nestjs/bull';
import { readingTime } from 'reading-time-estimator';
import { Prisma } from '@prisma/client';
import { RAGService } from '@/rag/rag.service';
import { PrismaService } from '@/common/prisma.service';
import { ElasticsearchService } from '@/common/elasticsearch.service';
import { MINIO_INTERNAL, MinioService } from '@/common/minio.service';
import {
  UpsertCollectionRequest,
  UpsertResourceRequest,
  ResourceMeta,
  ListResourcesData,
  ListCollectionsData,
  ListNotesData,
  UpsertNoteRequest,
  User,
  GetResourceDetailData,
  AddResourceToCollectionRequest,
  RemoveResourceFromCollectionRequest,
  IndexStatus,
} from '@refly/openapi-schema';
import {
  CHANNEL_FINALIZE_RESOURCE,
  QUEUE_SIMPLE_EVENT,
  QUEUE_RESOURCE,
  streamToString,
} from '@/utils';
import { genCollectionID, genResourceID, cleanMarkdownForIngest, genNoteID } from '@refly/utils';
import { FinalizeResourceParam } from './knowledge.dto';
import { pick, omit } from '../utils';
import { SimpleEventData } from '@/event/event.dto';

@Injectable()
export class KnowledgeService {
  private logger = new Logger(KnowledgeService.name);

  constructor(
    private prisma: PrismaService,
    private elasticsearch: ElasticsearchService,
    private ragService: RAGService,
    @Inject(MINIO_INTERNAL) private minio: MinioService,
    @InjectQueue(QUEUE_RESOURCE) private queue: Queue<FinalizeResourceParam>,
    @InjectQueue(QUEUE_SIMPLE_EVENT) private simpleEventQueue: Queue<SimpleEventData>,
  ) {}

  async listCollections(user: User, params: ListCollectionsData['query']) {
    const { page, pageSize } = params;
    return this.prisma.collection.findMany({
      where: { uid: user.uid, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async getCollectionDetail(user: User, param: { collectionId: string }) {
    const { collectionId } = param;

    const coll = await this.prisma.collection.findFirst({
      where: { collectionId, deletedAt: null },
      include: {
        resources: {
          where: {
            deletedAt: null,
            OR: [{ isPublic: true }, { uid: user.uid }],
          },
        },
      },
    });
    if (!coll) {
      throw new NotFoundException('Collection not found');
    }

    // Permission check
    if (!coll.isPublic && coll.uid !== user.uid) {
      return null;
    }

    return coll;
  }

  async upsertCollection(user: User, param: UpsertCollectionRequest) {
    if (!param.collectionId) {
      param.collectionId = genCollectionID();
    }

    const collection = await this.prisma.collection.upsert({
      where: { collectionId: param.collectionId },
      create: {
        collectionId: param.collectionId,
        title: param.title,
        description: param.description,
        uid: user.uid,
        isPublic: param.isPublic,
      },
      update: { ...omit(param, ['collectionId']) },
    });

    await this.elasticsearch.upsertCollection({
      id: collection.collectionId,
      createdAt: collection.createdAt.toJSON(),
      updatedAt: collection.updatedAt.toJSON(),
      ...pick(collection, ['title', 'description', 'uid']),
    });

    return collection;
  }

  async addResourceToCollection(user: User, param: AddResourceToCollectionRequest) {
    const { resourceIds = [], collectionId } = param;

    if (resourceIds.length === 0) {
      throw new BadRequestException('resourceIds is required');
    }

    return this.prisma.collection.update({
      where: { collectionId, uid: user.uid, deletedAt: null },
      data: {
        resources: {
          connect: resourceIds.map((resourceId) => ({ resourceId })),
        },
      },
    });
  }

  async removeResourceFromCollection(user: User, param: RemoveResourceFromCollectionRequest) {
    const { resourceIds = [], collectionId } = param;

    if (resourceIds.length === 0) {
      throw new BadRequestException('resourceIds is required');
    }

    return this.prisma.collection.update({
      where: { collectionId, uid: user.uid, deletedAt: null },
      data: {
        resources: {
          disconnect: resourceIds.map((resourceId) => ({ resourceId })),
        },
      },
    });
  }

  async deleteCollection(user: User, collectionId: string) {
    const { uid } = user;
    const coll = await this.prisma.collection.findFirst({
      where: { collectionId, uid, deletedAt: null },
    });
    if (!coll) {
      throw new BadRequestException('Collection not found');
    }

    await this.prisma.$transaction([
      this.prisma.collection.update({
        where: { collectionId, uid, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
      this.prisma.labelInstance.updateMany({
        where: { entityType: 'collection', entityId: collectionId, uid, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
    ]);
  }

  async listResources(user: User, param: ListResourcesData['query']) {
    const { resourceId, resourceType, page = 1, pageSize = 10 } = param;

    const resources = await this.prisma.resource.findMany({
      where: { resourceId, resourceType, uid: user.uid, deletedAt: null },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
    });

    return resources.map((r) => ({
      ...r,
      data: JSON.parse(r.meta),
    }));
  }

  async getResourceDetail(user: User, param: GetResourceDetailData['query']) {
    const { resourceId } = param;

    const resource = await this.prisma.resource.findFirst({
      where: { resourceId, deletedAt: null },
      include: { collections: { where: { deletedAt: null } } },
    });

    if (!resource.isPublic && resource.uid !== user.uid) {
      return null;
    }

    const contentStream = await this.minio.client.getObject(resource.storageKey);
    const content = await streamToString(contentStream);

    return { ...resource, content };
  }

  async createResource(user: User, param: UpsertResourceRequest) {
    param.resourceId = genResourceID();

    if (param.readOnly === undefined) {
      param.readOnly = param.resourceType === 'weblink';
    }

    if (param.resourceType === 'weblink') {
      if (!param.data) {
        throw new BadRequestException('data is required');
      }
      const { url, title } = param.data;
      if (!url) {
        throw new BadRequestException('url is required');
      }
      param.title ||= title;
    } else if (param.resourceType === 'text') {
      if (!param.content) {
        throw new BadRequestException('content is required for text resource');
      }
      // if (param.content.length > 10000) {
      //   throw new BadRequestException('content is too long');
      // }
    } else {
      throw new BadRequestException('Invalid resource type');
    }

    const cleanedContent = param.content?.replace(/x00/g, '') ?? '';
    const indexStatus: IndexStatus = param.content ? 'wait_index' : 'wait_parse';

    const resource = await this.prisma.resource.create({
      data: {
        resourceId: param.resourceId,
        resourceType: param.resourceType,
        meta: JSON.stringify(param.data || {}),
        contentPreview: cleanedContent?.slice(0, 500),
        uid: user.uid,
        isPublic: param.isPublic,
        readOnly: param.readOnly,
        title: param.title || 'Untitled',
        indexStatus,
        ...(param.collectionId
          ? {
              collections: {
                connect: { collectionId: param.collectionId },
              },
            }
          : {}),
      },
    });

    await this.queue.add(CHANNEL_FINALIZE_RESOURCE, { ...param, uid: user.uid });
    // await this.finalizeResource(param);

    return resource;
  }

  async batchCreateResource(user: User, params: UpsertResourceRequest[]) {
    const limit = pLimit(5);
    const tasks = params.map((param) => limit(async () => await this.createResource(user, param)));
    return Promise.all(tasks);
  }

  async indexResource(user: User, param: UpsertResourceRequest) {
    const { resourceType, resourceId, data = {} } = param;
    const { url, title } = data;

    param.content ||= '';

    if (!param.content && url) {
      const { data } = await this.ragService.crawlFromRemoteReader(url);
      param.content = data.content;
      param.title ||= data.title;
    }

    // Remove invalid UTF-8 byte sequences
    param.content = param.content?.replace(/x00/g, '') ?? '';

    const storageKey = `resources/${resourceId}.txt`;
    await this.minio.client.putObject(storageKey, param.content);

    const resource = await this.prisma.resource.update({
      where: { resourceId, uid: user.uid },
      data: {
        storageKey,
        wordCount: readingTime(param.content).words,
        title: param.title,
        indexStatus: 'wait_index',
        contentPreview: param.content?.slice(0, 500),
        meta: JSON.stringify({
          url,
          title: param.title,
        } as ResourceMeta),
      },
    });

    await this.elasticsearch.upsertResource({
      id: resource.resourceId,
      content: param.content,
      url,
      createdAt: resource.createdAt.toJSON(),
      updatedAt: resource.updatedAt.toJSON(),
      ...pick(resource, ['title', 'uid']),
    });

    // ensure the document is for ingestion use
    if (param.content) {
      const chunks = await this.ragService.indexContent({
        pageContent: cleanMarkdownForIngest(param.content),
        metadata: { nodeType: 'resource', url, title, resourceType, resourceId },
      });
      await this.ragService.saveDataForUser(user, { chunks });
    }

    this.logger.log(
      `save resource segments for user ${user.uid} success, resourceId: ${resourceId}`,
    );

    await this.prisma.resource.update({
      where: { resourceId, uid: user.uid },
      data: { indexStatus: 'finish' },
    });
  }

  /**
   * Process resource after being inserted, including scraping actual content, chunking and
   * save embeddings to vector store.
   */
  async finalizeResource(param: FinalizeResourceParam) {
    const user = await this.prisma.user.findFirst({ where: { uid: param.uid } });
    if (!user) {
      this.logger.warn(`User not found, userId: ${param.uid}`);
      return;
    }

    try {
      await this.indexResource(user, param);
      await this.simpleEventQueue.add({
        entityType: 'resource',
        entityId: param.resourceId,
        name: 'onResourceReady',
        uid: user.uid,
      });
    } catch (err) {
      console.error(err);
      this.logger.error(`finalize resource error: ${err}`);
      await this.prisma.resource.update({
        where: { resourceId: param.resourceId, uid: user.uid },
        data: { indexStatus: 'failed' },
      });
      throw err;
    }
  }

  async updateResource(user: User, param: UpsertResourceRequest) {
    const resource = await this.prisma.resource.findFirst({
      where: { resourceId: param.resourceId, uid: user.uid },
    });
    if (!resource) {
      throw new BadRequestException('Resource not found');
    }

    const updates: Prisma.ResourceUpdateInput = pick(param, ['title', 'isPublic', 'readOnly']);
    if (param.data) {
      updates.meta = JSON.stringify(param.data);
    }
    if (param.content) {
      await this.minio.client.putObject(resource.storageKey, param.content);
    }

    const updatedResource = await this.prisma.resource.update({
      where: { resourceId: param.resourceId, uid: user.uid },
      data: updates,
    });

    await this.elasticsearch.upsertResource({
      id: updatedResource.resourceId,
      content: param.content || undefined,
      createdAt: updatedResource.createdAt.toJSON(),
      updatedAt: updatedResource.updatedAt.toJSON(),
      ...pick(updatedResource, ['title', 'uid']),
    });

    return updatedResource;
  }

  async deleteResource(user: User, resourceId: string) {
    const { uid } = user;
    const resource = await this.prisma.resource.findFirst({
      where: { resourceId, uid, deletedAt: null },
    });
    if (!resource) {
      throw new BadRequestException('Resource not found');
    }

    await this.prisma.$transaction([
      this.prisma.resource.update({
        where: { resourceId, uid, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
      this.prisma.labelInstance.updateMany({
        where: { entityType: 'resource', entityId: resourceId, uid, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
    ]);

    await Promise.all([
      this.minio.client.removeObject(resource.storageKey),
      this.ragService.deleteResourceNodes(user, resourceId),
      this.elasticsearch.deleteResource(resourceId),
    ]);
  }

  async listNotes(user: User, param: ListNotesData['query']) {
    const { page = 1, pageSize = 10 } = param;
    return this.prisma.note.findMany({
      where: {
        uid: user.uid,
        deletedAt: null,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getNoteDetail(user: User, noteId: string) {
    const note = await this.prisma.note.findFirst({
      where: { noteId, uid: user.uid, deletedAt: null },
    });
    if (!note) {
      throw new BadRequestException('Note not found');
    }

    if (!note.storageKey) {
      return note;
    }

    const contentStream = await this.minio.client.getObject(note.storageKey);
    const content = await streamToString(contentStream);

    return { ...note, content };
  }

  async upsertNote(user: User, param: UpsertNoteRequest) {
    param.noteId ||= genNoteID();

    const note = await this.prisma.note.upsert({
      where: { noteId: param.noteId },
      create: {
        noteId: param.noteId,
        title: param.title,
        uid: user.uid,
        readOnly: param.readOnly ?? false,
        isPublic: param.isPublic ?? false,
      },
      update: param,
    });

    await this.elasticsearch.upsertNote({
      id: param.noteId,
      ...pick(note, ['title', 'uid']),
      createdAt: note.createdAt.toJSON(),
      updatedAt: note.updatedAt.toJSON(),
    });

    return note;
  }

  async deleteNote(user: User, noteId: string) {
    const { uid } = user;
    const note = await this.prisma.note.findFirst({
      where: { noteId, uid, deletedAt: null },
    });
    if (!note) {
      throw new BadRequestException('Note not found');
    }

    await this.prisma.$transaction([
      this.prisma.note.update({
        where: { noteId },
        data: { deletedAt: new Date() },
      }),
      this.prisma.labelInstance.updateMany({
        where: { entityType: 'note', entityId: noteId, uid, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
    ]);

    const cleanups: Promise<any>[] = [
      this.minio.client.removeObject(note.storageKey),
      this.ragService.deleteNoteNodes(user, noteId),
      this.elasticsearch.deleteNote(noteId),
    ];

    if (note.stateStorageKey) {
      cleanups.push(this.minio.client.removeObject(note.stateStorageKey));
    }

    await Promise.all(cleanups);
  }
}
