import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { readingTime } from 'reading-time-estimator';
import { Prisma, User } from '@prisma/client';
import { RAGService } from '../rag/rag.service';
import { PrismaService } from '../common/prisma.service';
import { MinioService } from '../common/minio.service';
import {
  UpsertCollectionRequest,
  UpsertResourceRequest,
  ResourceMeta,
  ListResourcesData,
  ListCollectionsData,
  ListNotesData,
  UpsertNoteRequest,
} from '@refly/openapi-schema';
import { CHANNEL_FINALIZE_RESOURCE, QUEUE_RESOURCE } from '../utils';
import { genCollectionID, genResourceID, cleanMarkdownForIngest, genNoteID } from '@refly/utils';
import { FinalizeResourceParam } from './knowledge.dto';
import { pick, omit } from '../utils';

@Injectable()
export class KnowledgeService {
  private logger = new Logger(KnowledgeService.name);

  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
    private ragService: RAGService,
    @InjectQueue(QUEUE_RESOURCE) private queue: Queue<FinalizeResourceParam>,
  ) {}

  async listCollections(user: Pick<User, 'uid'>, params: ListCollectionsData['query']) {
    const { page, pageSize } = params;
    return this.prisma.collection.findMany({
      where: { uid: user.uid, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async getCollectionDetail(user: Pick<User, 'uid'>, param: { collectionId: string }) {
    const { collectionId } = param;

    const coll = await this.prisma.collection.findFirst({
      where: { collectionId, uid: user.uid, deletedAt: null },
    });
    if (!coll) {
      throw new NotFoundException('Collection not found');
    }

    // Permission check
    if (!coll.isPublic && coll.uid !== user.uid) {
      return null;
    }

    let resources = await this.prisma.resource.findMany({
      where: { collectionId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });

    // If collection is read by other users, filter out resources that are not public
    if (coll.isPublic && coll.uid !== user.uid) {
      resources = resources.filter((r) => r.isPublic);
    }

    return { ...coll, resources };
  }

  async upsertCollection(user: Pick<User, 'uid'>, param: UpsertCollectionRequest) {
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

  async deleteCollection(user: Pick<User, 'uid'>, collectionId: string) {
    const coll = await this.prisma.collection.findFirst({
      where: { collectionId, deletedAt: null },
    });
    if (!coll) {
      throw new BadRequestException('Collection not found');
    }
    if (coll.uid !== user.uid) {
      throw new UnauthorizedException();
    }

    return this.prisma.collection.update({
      where: { collectionId, uid: user.uid },
      data: { deletedAt: new Date() },
    });
  }

  async listResources(user: Pick<User, 'uid'>, param: ListResourcesData['query']) {
    const { collectionId, resourceId, resourceType, page = 1, pageSize = 10 } = param;

    // Query resources by collection
    if (collectionId) {
      return this.prisma.resource.findMany({
        where: {
          collectionId,
          resourceType,
          deletedAt: null,
          OR: [{ isPublic: true }, { uid: user.uid }],
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      });
    }

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

  async getResourceDetail(user: Pick<User, 'uid'>, param: { resourceId: string }) {
    const { resourceId } = param;
    const resource = await this.prisma.resource.findFirst({
      where: { resourceId, deletedAt: null },
    });

    if (!resource.isPublic && resource.uid !== user.uid) {
      return null;
    }

    return resource;
  }

  async createResource(user: Pick<User, 'uid'>, param: UpsertResourceRequest) {
    param.resourceId = genResourceID();

    // If target collection not specified, create new one
    if (!param.collectionId) {
      param.collectionId = genCollectionID();
      this.logger.log(
        `create new collection for user ${user.uid}, collection id: ${param.collectionId}`,
      );
    }

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
    } else if (param.resourceType === 'note') {
      // do nothing
    } else {
      throw new BadRequestException('Invalid resource type');
    }

    const [resource] = await this.prisma.$transaction([
      this.prisma.resource.create({
        data: {
          resourceId: param.resourceId,
          resourceType: param.resourceType,
          collectionId: param.collectionId,
          meta: JSON.stringify(param.data),
          content: param.content ?? '',
          uid: user.uid,
          isPublic: param.isPublic,
          readOnly: param.readOnly,
          title: param.title || 'Untitled',
          indexStatus: 'processing',
        },
      }),
      this.prisma.collection.upsert({
        where: { collectionId: param.collectionId },
        create: {
          title: param.collectionName || 'Default Collection',
          uid: user.uid,
          collectionId: param.collectionId,
        },
        update: {},
      }),
    ]);

    await this.queue.add(CHANNEL_FINALIZE_RESOURCE, { ...param, uid: user.uid });
    // await this.finalizeResource(param);

    return resource;
  }

  async indexResource(user: User, param: UpsertResourceRequest) {
    const { resourceType, resourceId, collectionId } = param;
    const { url, storageKey, title } = param.data;
    param.storageKey ||= storageKey;
    param.content ||= '';

    if (param.storageKey) {
      param.content = (await this.minio.downloadData(param.storageKey)).toString();
    } else {
      if (!param.content && url) {
        const { data } = await this.ragService.crawlFromRemoteReader(url);
        param.content = data.content;
        param.title ||= data.title;
      }

      param.storageKey = `resource/${resourceId}`;
      const res = await this.minio.uploadData(param.storageKey, param.content);
      this.logger.log(`upload resource ${param.storageKey} success, res: ${JSON.stringify(res)}`);
    }

    // TODO: 减少不必要的重复插入

    // ensure the document is for ingestion use
    if (param.content) {
      const chunks = await this.ragService.indexContent({
        pageContent: cleanMarkdownForIngest(param.content),
        metadata: { nodeType: 'resource', url, title, collectionId, resourceType, resourceId },
      });
      await this.ragService.saveDataForUser(user, { chunks });
    }

    this.logger.log(
      `save resource segments for user ${user.uid} success, resourceId: ${resourceId}`,
    );

    await this.prisma.resource.update({
      where: { resourceId, uid: user.uid },
      data: {
        content: param.content,
        wordCount: readingTime(param.content).words,
        indexStatus: 'finish',
        meta: JSON.stringify({
          url,
          title: param.title,
          storageKey: param.storageKey,
        } as ResourceMeta),
      },
    });
  }

  /**
   * Process resource after inserted, including connecting with weblink and
   * save to vector store.
   */
  async finalizeResource(param: FinalizeResourceParam) {
    const user = await this.prisma.user.findFirst({ where: { uid: param.uid } });
    if (!user) {
      this.logger.warn(`User not found, userId: ${param.uid}`);
      return;
    }

    try {
      await this.indexResource(user, param);
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

  async updateResource(user: Pick<User, 'uid'>, param: UpsertResourceRequest) {
    const updates: Prisma.ResourceUpdateInput = pick(param, ['title', 'isPublic', 'readOnly']);
    if (param.data) {
      updates.meta = JSON.stringify(param.data);
    }
    if (param.content) {
      await this.minio.uploadData(param.storageKey, param.content);
    }
    return this.prisma.resource.update({
      where: { resourceId: param.resourceId, uid: user.uid },
      data: updates,
    });
  }

  async deleteResource(user: Pick<User, 'uid'>, resourceId: string) {
    const resource = await this.prisma.resource.findFirst({
      where: { resourceId, deletedAt: null },
    });
    if (!resource) {
      throw new BadRequestException('Resource not found');
    }
    if (resource.uid !== user.uid) {
      throw new UnauthorizedException();
    }

    return Promise.all([
      this.ragService.deleteResourceNodes(user, resourceId),
      this.prisma.resource.update({
        where: { resourceId },
        data: { deletedAt: new Date() },
      }),
    ]);
  }

  async listNotes(user: Pick<User, 'uid'>, param: ListNotesData['query']) {
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

  async getNoteDetail(user: Pick<User, 'uid'>, noteId: string) {
    const note = await this.prisma.note.findFirst({
      where: { noteId, uid: user.uid, deletedAt: null },
    });
    if (!note) {
      throw new BadRequestException('Note not found');
    }
    return note;
  }

  async upsertNote(user: Pick<User, 'uid'>, param: UpsertNoteRequest) {
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

  async deleteNote(user: Pick<User, 'uid'>, noteId: string) {
    const note = await this.prisma.note.findFirst({
      where: { noteId, deletedAt: null },
    });
    if (!note) {
      throw new BadRequestException('Note not found');
    }
    if (note.uid !== user.uid) {
      throw new UnauthorizedException();
    }

    const cleanups: Promise<any>[] = [
      this.ragService.deleteNoteNodes(user, noteId),
      this.prisma.note.update({
        where: { noteId },
        data: { deletedAt: new Date() },
      }),
    ];

    if (note.stateStorageKey) {
      cleanups.push(this.minio.removeObject(note.stateStorageKey));
    }

    await Promise.all(cleanups);
  }
}
