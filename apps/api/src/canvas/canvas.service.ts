import { Inject, Injectable, Logger } from '@nestjs/common';
import * as Y from 'yjs';
import { MINIO_INTERNAL } from '@/common/minio.service';
import { MinioService } from '@/common/minio.service';
import { PrismaService } from '@/common/prisma.service';
import { MiscService } from '@/misc/misc.service';
import { CollabService } from '@/collab/collab.service';
import { ElasticsearchService } from '@/common/elasticsearch.service';
import { CanvasNotFoundError } from '@refly-packages/errors';
import {
  DeleteCanvasRequest,
  Entity,
  ListCanvasesData,
  UpsertCanvasRequest,
  User,
} from '@refly-packages/openapi-schema';
import { genCanvasID } from '@refly-packages/utils';

@Injectable()
export class CanvasService {
  private logger = new Logger(CanvasService.name);

  constructor(
    private prisma: PrismaService,
    private elasticsearch: ElasticsearchService,
    private collabService: CollabService,
    private miscService: MiscService,
    @Inject(MINIO_INTERNAL) private minio: MinioService,
  ) {}

  async listCanvases(user: User, param: ListCanvasesData['query']) {
    const { page, pageSize } = param;

    return this.prisma.canvas.findMany({
      where: {
        uid: user.uid,
        deletedAt: null,
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async createCanvas(user: User, param: UpsertCanvasRequest) {
    const canvasId = genCanvasID();
    const stateStorageKey = `state/${canvasId}`;
    const canvas = await this.prisma.canvas.create({
      data: {
        uid: user.uid,
        canvasId,
        stateStorageKey,
        ...param,
      },
    });

    const ydoc = new Y.Doc();
    ydoc.getText('title').insert(0, param.title);

    await this.minio.client.putObject(stateStorageKey, Buffer.from(Y.encodeStateAsUpdate(ydoc)));

    this.logger.log(`created canvas data: ${JSON.stringify(ydoc.toJSON())}`);

    await this.elasticsearch.upsertCanvas({
      id: canvas.canvasId,
      title: canvas.title,
      createdAt: canvas.createdAt.toJSON(),
      updatedAt: canvas.updatedAt.toJSON(),
      uid: canvas.uid,
    });

    return canvas;
  }

  async updateCanvas(user: User, param: UpsertCanvasRequest) {
    const { canvasId, title = '' } = param;

    const updatedCanvas = await this.prisma.canvas.update({
      where: { canvasId, uid: user.uid, deletedAt: null },
      data: { title },
    });

    if (!updatedCanvas) {
      throw new CanvasNotFoundError();
    }

    // Update title in yjs document
    const connection = await this.collabService.openDirectConnection(canvasId, {
      user,
      entity: updatedCanvas,
      entityType: 'canvas',
    });
    connection.document.transact(() => {
      const title = connection.document.getText('title');
      title.delete(0, title.length);
      title.insert(0, param.title);
    });
    await connection.disconnect();

    await this.elasticsearch.upsertCanvas({
      id: updatedCanvas.canvasId,
      title: updatedCanvas.title,
      updatedAt: updatedCanvas.updatedAt.toJSON(),
      uid: updatedCanvas.uid,
    });

    return updatedCanvas;
  }

  async deleteCanvas(user: User, param: DeleteCanvasRequest) {
    const { uid } = user;
    const { canvasId } = param;

    const canvas = await this.prisma.canvas.findFirst({
      where: { canvasId, uid, deletedAt: null },
    });
    if (!canvas) {
      throw new CanvasNotFoundError();
    }

    const cleanups: Promise<any>[] = [
      this.prisma.canvas.update({
        where: { canvasId },
        data: { deletedAt: new Date() },
      }),
      this.miscService.removeFilesByEntity(user, {
        entityId: canvas.canvasId,
        entityType: 'canvas',
      }),
      this.elasticsearch.deleteCanvas(canvas.canvasId),
    ];

    if (canvas.stateStorageKey) {
      cleanups.push(this.minio.client.removeObject(canvas.stateStorageKey));
    }

    const files = await this.prisma.staticFile.findMany({
      where: { entityId: canvas.canvasId, entityType: 'canvas' },
    });

    if (files.length > 0) {
      cleanups.push(
        this.prisma.staticFile.deleteMany({
          where: { entityId: canvas.canvasId, entityType: 'canvas' },
        }),
      );
    }

    await Promise.all(cleanups);
  }

  async syncCanvasEntityRelation(canvasId: string) {
    this.logger.log(`syncCanvasEntityRelation called for ${canvasId}`);

    const canvas = await this.prisma.canvas.findUnique({
      where: { canvasId },
    });
    if (!canvas) {
      throw new CanvasNotFoundError();
    }

    const ydoc = new Y.Doc();
    await this.collabService.loadDocument({
      document: ydoc,
      context: {
        user: { uid: canvas.uid },
        entity: canvas,
        entityType: 'canvas',
      },
    });
    const nodes = ydoc.getArray('nodes').toJSON();

    const entities: Entity[] = nodes
      .map((node) => ({
        entityId: node.data?.entityId,
        entityType: node.type,
      }))
      .filter((entity) => entity.entityId && entity.entityType);

    const existingRelations = await this.prisma.canvasEntityRelation.findMany({
      where: { canvasId, deletedAt: null },
    });

    // Find relations to be removed (soft delete)
    const entityIds = new Set(entities.map((e) => e.entityId));
    const relationsToRemove = existingRelations.filter(
      (relation) => !entityIds.has(relation.entityId),
    );

    // Find new relations to be created
    const existingEntityIds = new Set(existingRelations.map((r) => r.entityId));
    const relationsToCreate = entities.filter((entity) => !existingEntityIds.has(entity.entityId));

    // Perform bulk operations
    await Promise.all([
      // Soft delete removed relations in bulk
      this.prisma.canvasEntityRelation.updateMany({
        where: {
          canvasId,
          entityId: { in: relationsToRemove.map((r) => r.entityId) },
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      }),
      // Create new relations in bulk
      this.prisma.canvasEntityRelation.createMany({
        data: relationsToCreate.map((entity) => ({
          canvasId,
          entityId: entity.entityId,
          entityType: entity.entityType,
        })),
        skipDuplicates: true,
      }),
    ]);
  }
}
