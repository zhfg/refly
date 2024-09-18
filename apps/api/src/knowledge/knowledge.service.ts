import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Queue } from 'bull';
import pLimit from 'p-limit';
import { InjectQueue } from '@nestjs/bull';
import { readingTime } from 'reading-time-estimator';
import { Prisma, Resource as ResourceModel } from '@prisma/client';
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
  ReindexResourceRequest,
  ResourceType,
} from '@refly/openapi-schema';
import {
  CHANNEL_FINALIZE_RESOURCE,
  QUEUE_SIMPLE_EVENT,
  QUEUE_RESOURCE,
  streamToString,
} from '@/utils';
import {
  genCollectionID,
  genResourceID,
  cleanMarkdownForIngest,
  genNoteID,
  markdown2StateUpdate,
} from '@refly/utils';
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
          orderBy: { updatedAt: 'desc' },
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

    let storageKey: string;

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

      // save text content to object storage
      storageKey = `resources/${param.resourceId}.txt`;
      await this.minio.client.putObject(storageKey, param.content);
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
        storageKey,
        uid: user.uid,
        isPublic: param.isPublic,
        readOnly: !!param.readOnly,
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

    // Add to queue to be processed by worker
    await this.queue.add(CHANNEL_FINALIZE_RESOURCE, {
      resourceId: resource.resourceId,
      uid: user.uid,
    });

    return resource;
  }

  async batchCreateResource(user: User, params: UpsertResourceRequest[]) {
    const limit = pLimit(5);
    const tasks = params.map((param) => limit(async () => await this.createResource(user, param)));
    return Promise.all(tasks);
  }

  /**
   * Parse resource content from remote URL into markdown.
   * Currently only weblinks are supported.
   */
  async parseResource(user: User, resource: ResourceModel): Promise<ResourceModel> {
    if (resource.indexStatus !== 'wait_parse' && resource.indexStatus !== 'parse_failed') {
      this.logger.warn(
        `Resource ${resource.resourceId} is not in wait_parse or parse_failed status, skip parse`,
      );
      return resource;
    }

    const { resourceId, meta } = resource;
    const { url } = JSON.parse(meta) as ResourceMeta;

    let content: string = '';
    let title: string = '';

    if (url) {
      const { data } = await this.ragService.crawlFromRemoteReader(url);
      content = data.content?.replace(/x00/g, '') ?? '';
      title ||= data.title;
    }

    const storageKey = `resources/${resourceId}.txt`;
    await this.minio.client.putObject(storageKey, content);

    const updatedResource = await this.prisma.resource.update({
      where: { resourceId, uid: user.uid },
      data: {
        storageKey,
        wordCount: readingTime(content).words,
        title: resource.title,
        indexStatus: 'wait_index',
        contentPreview: content?.slice(0, 500),
        meta: JSON.stringify({
          url,
          title: resource.title,
        } as ResourceMeta),
      },
    });

    await this.elasticsearch.upsertResource({
      id: resourceId,
      content,
      url,
      createdAt: resource.createdAt.toJSON(),
      updatedAt: resource.updatedAt.toJSON(),
      ...pick(updatedResource, ['title', 'uid']),
    });

    return updatedResource;
  }

  /**
   * Index resource content into vector store.
   */
  async indexResource(user: User, resource: ResourceModel): Promise<ResourceModel> {
    if (resource.indexStatus !== 'wait_index' && resource.indexStatus !== 'index_failed') {
      this.logger.warn(`Resource ${resource.resourceId} is not in wait_index status, skip index`);
      return resource;
    }

    const { resourceType, resourceId, meta, storageKey } = resource;
    const { url, title } = JSON.parse(meta) as ResourceMeta;

    if (storageKey) {
      const contentStream = await this.minio.client.getObject(storageKey);
      const content = await streamToString(contentStream);
      const chunks = await this.ragService.indexContent({
        pageContent: cleanMarkdownForIngest(content),
        metadata: {
          nodeType: 'resource',
          url,
          title,
          resourceType: resourceType as ResourceType,
          resourceId,
        },
      });
      await this.ragService.saveDataForUser(user, { chunks });

      this.logger.log(
        `save resource segments for user ${user.uid} success, resourceId: ${resourceId}`,
      );
    }

    return this.prisma.resource.update({
      where: { resourceId, uid: user.uid },
      data: { indexStatus: 'finish' },
    });
  }

  /**
   * Process resource after being inserted, including scraping actual content, chunking and
   * save embeddings to vector store.
   */
  async finalizeResource(param: FinalizeResourceParam): Promise<ResourceModel | null> {
    const { resourceId, uid } = param;

    const user = await this.prisma.user.findFirst({ where: { uid } });
    if (!user) {
      this.logger.warn(`User not found, userId: ${uid}`);
      return null;
    }

    let resource = await this.prisma.resource.findFirst({
      where: { resourceId, uid: user.uid },
    });
    if (!resource) {
      this.logger.warn(`Resource not found, resourceId: ${resourceId}`);
      return null;
    }

    try {
      resource = await this.parseResource(user, resource);
    } catch (err) {
      this.logger.error(`parse resource error: ${err?.stack}`);
      return this.prisma.resource.update({
        where: { resourceId, uid: user.uid },
        data: { indexStatus: 'parse_failed' },
      });
    }

    try {
      resource = await this.indexResource(user, resource);
    } catch (err) {
      this.logger.error(`index resource error: ${err?.stack}`);
      return this.prisma.resource.update({
        where: { resourceId, uid: user.uid },
        data: { indexStatus: 'index_failed' },
      });
    }

    // Send simple event
    await this.simpleEventQueue.add({
      entityType: 'resource',
      entityId: resourceId,
      name: 'onResourceReady',
      uid: user.uid,
    });

    return resource;
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

  async reindexResource(user: User, param: ReindexResourceRequest) {
    const { resourceIds = [] } = param;
    const limit = pLimit(5);
    const tasks = resourceIds.map((resourceId) =>
      limit(() => this.finalizeResource({ resourceId, uid: user.uid })),
    );
    return Promise.all(tasks);
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
    const isNewNote = !param.noteId;

    param.noteId ||= genNoteID();

    let storageKey: string | undefined;
    let stateStorageKey: string | undefined;

    if (isNewNote && param.initialContent) {
      storageKey = `notes/${param.noteId}.txt`;
      stateStorageKey = `state/${param.noteId}`;
      const ydoc = markdown2StateUpdate(param.initialContent);
      await Promise.all([
        this.minio.client.putObject(storageKey, param.initialContent),
        this.minio.client.putObject(stateStorageKey, Buffer.from(ydoc)),
      ]);
    }

    const note = await this.prisma.note.upsert({
      where: { noteId: param.noteId },
      create: {
        noteId: param.noteId,
        title: param.title,
        uid: user.uid,
        readOnly: param.readOnly ?? false,
        isPublic: param.isPublic ?? false,
        content: param.initialContent,
        contentPreview: param.initialContent?.slice(0, 500),
        storageKey,
        stateStorageKey,
      },
      update: {
        ...pick(param, ['title', 'readOnly', 'isPublic']),
      },
    });

    await this.elasticsearch.upsertNote({
      id: param.noteId,
      ...pick(note, ['title', 'uid']),
      content: param.initialContent,
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
