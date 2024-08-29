import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Queue } from 'bull';
import pLimit from 'p-limit';
import { InjectQueue } from '@nestjs/bull';
import { readingTime } from 'reading-time-estimator';
import { Prisma } from '@prisma/client';
import { RAGService } from '../rag/rag.service';
import { PrismaService } from '../common/prisma.service';
import { MINIO_INTERNAL, MinioService } from '../common/minio.service';
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
} from '@refly/openapi-schema';
import {
  CHANNEL_FINALIZE_RESOURCE,
  QUEUE_SIMPLE_EVENT,
  QUEUE_RESOURCE,
  streamToString,
} from '../utils';
import { genCollectionID, genResourceID, cleanMarkdownForIngest, genNoteID } from '@refly/utils';
import { FinalizeResourceParam } from './knowledge.dto';
import { pick, omit } from '../utils';
import { SimpleEventData } from '@/event/event.dto';

@Injectable()
export class KnowledgeService {
  private logger = new Logger(KnowledgeService.name);

  constructor(
    private prisma: PrismaService,
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
      where: { collectionId, uid: user.uid, deletedAt: null },
      include: { resources: { where: { deletedAt: null } } },
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

    return this.prisma.collection.upsert({
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

    return resource;
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

    const resource = await this.prisma.resource.create({
      data: {
        resourceId: param.resourceId,
        resourceType: param.resourceType,
        meta: JSON.stringify(param.data || {}),
        content: param.content ?? '',
        uid: user.uid,
        isPublic: param.isPublic,
        readOnly: param.readOnly,
        title: param.title || 'Untitled',
        indexStatus: 'processing',
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
    const { url, storageKey, title } = data;
    param.storageKey ||= storageKey;
    param.content ||= '';

    if (param.storageKey) {
      const readable = await this.minio.client.getObject(param.storageKey);
      param.content = await streamToString(readable);
    } else {
      if (!param.content && url) {
        const { data } = await this.ragService.crawlFromRemoteReader(url);
        param.content = data.content;
        param.title ||= data.title;
      }
    }

    await this.prisma.resource.update({
      where: { resourceId, uid: user.uid },
      data: {
        content: param.content,
        wordCount: readingTime(param.content).words,
        title: param.title,
        meta: JSON.stringify({
          url,
          title: param.title,
          storageKey: param.storageKey,
        } as ResourceMeta),
      },
    });

    // TODO: remove unnecessary duplicate insertions

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
    const updates: Prisma.ResourceUpdateInput = pick(param, ['title', 'isPublic', 'readOnly']);
    if (param.data) {
      updates.meta = JSON.stringify(param.data);
    }
    if (param.content) {
      await this.minio.client.putObject(param.storageKey, param.content);
    }
    return this.prisma.resource.update({
      where: { resourceId: param.resourceId, uid: user.uid },
      data: updates,
    });
  }

  async deleteResource(user: User, resourceId: string) {
    const { uid } = user;
    const resource = await this.prisma.resource.findFirst({
      where: { resourceId, uid, deletedAt: null },
    });
    if (!resource) {
      throw new BadRequestException('Resource not found');
    }

    return Promise.all([
      this.ragService.deleteResourceNodes(user, resourceId),
      this.prisma.resource.update({
        where: { resourceId, uid, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
      this.prisma.labelInstance.updateMany({
        where: { entityType: 'resource', entityId: resourceId, uid, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
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

    return note;
  }

  async upsertNote(user: User, param: UpsertNoteRequest) {
    param.noteId ||= genNoteID();

    return this.prisma.note.upsert({
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
  }

  async deleteNote(user: User, noteId: string) {
    const { uid } = user;
    const note = await this.prisma.note.findFirst({
      where: { noteId, uid, deletedAt: null },
    });
    if (!note) {
      throw new BadRequestException('Note not found');
    }

    const cleanups: Promise<any>[] = [
      this.ragService.deleteNoteNodes(user, noteId),
      this.prisma.note.update({
        where: { noteId },
        data: { deletedAt: new Date() },
      }),
      this.prisma.labelInstance.updateMany({
        where: { entityType: 'note', entityId: noteId, uid, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
    ];

    if (note.stateStorageKey) {
      cleanups.push(this.minio.client.removeObject(note.stateStorageKey));
    }

    await Promise.all(cleanups);
  }
}
