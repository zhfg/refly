import { Inject, Injectable, Logger } from '@nestjs/common';
import * as Y from 'yjs';
import pLimit from 'p-limit';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { MINIO_INTERNAL } from '@/common/minio.service';
import { MinioService } from '@/common/minio.service';
import { PrismaService } from '@/common/prisma.service';
import { MiscService } from '@/misc/misc.service';
import { CollabService } from '@/collab/collab.service';
import { ElasticsearchService } from '@/common/elasticsearch.service';
import { CanvasNotFoundError } from '@refly-packages/errors';
import {
  AutoNameCanvasRequest,
  DeleteCanvasRequest,
  DuplicateCanvasRequest,
  Entity,
  EntityType,
  ListCanvasesData,
  ListCanvasTemplatesData,
  RawCanvasData,
  UpsertCanvasRequest,
  User,
  ShareUser,
  CreateCanvasTemplateRequest,
  UpdateCanvasTemplateRequest,
  CanvasNode,
} from '@refly-packages/openapi-schema';
import { Prisma } from '@prisma/client';
import { genCanvasID, genCanvasTemplateID } from '@refly-packages/utils';
import { DeleteKnowledgeEntityJobData } from '@/knowledge/knowledge.dto';
import { QUEUE_DELETE_KNOWLEDGE_ENTITY, QUEUE_DUPLICATE_CANVAS } from '@/utils/const';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { SystemMessage } from '@langchain/core/messages';
import { AutoNameCanvasJobData, DuplicateCanvasJobData } from './canvas.dto';
import { streamToBuffer } from '@/utils';
import { SubscriptionService } from '@/subscription/subscription.service';
import { KnowledgeService } from '@/knowledge/knowledge.service';
import { ActionService } from '@/action/action.service';

@Injectable()
export class CanvasService {
  private logger = new Logger(CanvasService.name);

  constructor(
    private prisma: PrismaService,
    private elasticsearch: ElasticsearchService,
    private collabService: CollabService,
    private miscService: MiscService,
    private actionService: ActionService,
    private knowledgeService: KnowledgeService,
    private subscriptionService: SubscriptionService,
    @Inject(MINIO_INTERNAL) private minio: MinioService,
    @InjectQueue(QUEUE_DELETE_KNOWLEDGE_ENTITY)
    private deleteKnowledgeQueue: Queue<DeleteKnowledgeEntityJobData>,
    @InjectQueue(QUEUE_DUPLICATE_CANVAS)
    private duplicateCanvasQueue: Queue<DuplicateCanvasJobData>,
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

  async getCanvasDetail(user: User, canvasId: string) {
    const canvas = await this.prisma.canvas.findFirst({
      where: { canvasId, uid: user.uid, deletedAt: null },
    });

    if (!canvas) {
      throw new CanvasNotFoundError();
    }

    return canvas;
  }

  async getCanvasRawData(user: User | null, canvasId: string): Promise<RawCanvasData> {
    const canvas = await this.prisma.canvas.findFirst({
      select: {
        title: true,
        uid: true,
        isPublic: true,
        stateStorageKey: true,
      },
      where: {
        canvasId,
        deletedAt: null,
      },
    });

    if (!canvas) {
      throw new CanvasNotFoundError();
    }

    if ((!user || user.uid !== canvas.uid) && !canvas.isPublic) {
      throw new CanvasNotFoundError();
    }

    const readable = await this.minio.client.getObject(canvas.stateStorageKey);
    const state = await streamToBuffer(readable);

    const doc = new Y.Doc();
    Y.applyUpdate(doc, state);

    return {
      title: canvas.title,
      nodes: doc.getArray('nodes').toJSON(),
      edges: doc.getArray('edges').toJSON(),
      isPublic: canvas.isPublic,
    };
  }

  async duplicateCanvas(user: User, param: DuplicateCanvasRequest) {
    const { title, canvasId, duplicateEntities } = param;

    const canvas = await this.prisma.canvas.findFirst({
      where: { canvasId, deletedAt: null, OR: [{ uid: user.uid }, { isPublic: true }] },
    });

    if (!canvas) {
      throw new CanvasNotFoundError();
    }

    const newCanvasId = genCanvasID();
    const stateStorageKey = `state/${newCanvasId}`;
    const state = await this.minio.client.getObject(canvas.stateStorageKey);
    await this.minio.client.putObject(stateStorageKey, state);

    const newCanvas = await this.prisma.canvas.create({
      data: {
        uid: user.uid,
        canvasId: newCanvasId,
        stateStorageKey,
        title: title || canvas.title,
        status: 'duplicating',
      },
    });

    // Queue the duplication job
    await this.duplicateCanvasQueue.add(
      'duplicateCanvas',
      {
        uid: user.uid,
        sourceCanvasId: canvasId,
        targetCanvasId: newCanvasId,
        title: title || canvas.title,
        duplicateEntities: canvas.uid !== user.uid || duplicateEntities,
      },
      {
        jobId: `duplicate_${newCanvasId}`,
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3,
      },
    );

    return newCanvas;
  }

  async _duplicateCanvas(jobData: DuplicateCanvasJobData) {
    const { uid, sourceCanvasId, targetCanvasId, duplicateEntities } = jobData;

    const user = await this.prisma.user.findUnique({
      where: { uid },
    });
    if (!user) {
      this.logger.error(`User ${uid} not found`);
      return;
    }

    const canvas = await this.prisma.canvas.findFirst({
      where: { canvasId: sourceCanvasId, deletedAt: null },
    });

    if (!canvas) {
      throw new CanvasNotFoundError();
    }

    const readable = await this.minio.client.getObject(canvas.stateStorageKey);
    const state = await streamToBuffer(readable);

    const doc = new Y.Doc();
    Y.applyUpdate(doc, state);

    const nodes: CanvasNode[] = doc.getArray('nodes').toJSON();
    this.logger.log(
      `Duplicating ${nodes.length} nodes from canvas ${sourceCanvasId} to ${targetCanvasId}`,
    );

    if (duplicateEntities) {
      // Duplicate each entity
      const limit = pLimit(3); // Limit concurrent operations

      await Promise.all(
        nodes.map((node) =>
          limit(async () => {
            const entityType = node.type;
            const { entityId } = node.data;

            // Create new entity based on type
            switch (entityType) {
              case 'document': {
                const doc = await this.knowledgeService.duplicateDocument(user, {
                  docId: entityId,
                  title: node.data?.title,
                });
                if (doc) {
                  node.data.entityId = doc.docId;
                }
                break;
              }
              case 'resource': {
                const resource = await this.knowledgeService.duplicateResource(user, {
                  resourceId: entityId,
                  title: node.data?.title,
                });
                if (resource) {
                  node.data.entityId = resource.resourceId;
                }
                break;
              }
              case 'skillResponse': {
                const result = await this.actionService.duplicateActionResult(user, entityId);
                if (result) {
                  node.data.entityId = result.resultId;
                }
                break;
              }
              case 'image': {
                if (node.data?.metadata?.storageKey) {
                  const file = await this.miscService.duplicateFile(
                    user,
                    node.data.metadata.storageKey as string,
                  );
                  if (file) {
                    node.data.metadata.storageKey = file.storageKey;
                  }
                }
                break;
              }
            }
          }),
        ),
      );
    }

    doc.transact(() => {
      doc.getArray('nodes').delete(0, doc.getArray('nodes').length);
      doc.getArray('nodes').insert(0, nodes);
    });

    const stateStorageKey = `state/${targetCanvasId}`;
    await this.minio.client.putObject(stateStorageKey, Buffer.from(Y.encodeStateAsUpdate(doc)));

    // Update canvas status to completed
    await this.prisma.canvas.update({
      where: { canvasId: targetCanvasId },
      data: { status: 'ready' },
    });

    this.logger.log(`Successfully duplicated canvas ${sourceCanvasId} to ${targetCanvasId}`);
  }

  async duplicateCanvasFromQueue(jobData: DuplicateCanvasJobData) {
    const { sourceCanvasId, targetCanvasId } = jobData;

    try {
      await this._duplicateCanvas(jobData);
    } catch (error) {
      this.logger.error(
        `Error duplicating canvas ${sourceCanvasId} to ${targetCanvasId}: ${error?.stack}`,
      );

      // Update canvas status to failed
      await this.prisma.canvas.update({
        where: { canvasId: targetCanvasId },
        data: { status: 'failed' },
      });
      throw error;
    }
  }

  async createCanvas(user: User, param: UpsertCanvasRequest) {
    const canvasId = genCanvasID();
    const stateStorageKey = `state/${canvasId}`;
    const canvas = await this.prisma.canvas.create({
      data: {
        uid: user.uid,
        canvasId,
        title: param.title,
        stateStorageKey,
        isPublic: param.isPublic,
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
    const { canvasId, title, isPublic } = param;

    const updates: Prisma.CanvasUpdateInput = {};

    if (title !== undefined) {
      updates.title = title;
    }
    if (isPublic !== undefined) {
      updates.isPublic = isPublic;
    }

    const updatedCanvas = await this.prisma.$transaction(async (tx) => {
      const canvas = await tx.canvas.update({
        where: { canvasId, uid: user.uid, deletedAt: null },
        data: updates,
      });

      if (updates.isPublic !== undefined) {
        // Create share records for all entities in this canvas
        await tx.canvasEntityRelation.updateMany({
          where: { canvasId, deletedAt: null },
          data: { isPublic: updates.isPublic },
        });
      }

      return canvas;
    });

    if (!updatedCanvas) {
      throw new CanvasNotFoundError();
    }

    // Update title in yjs document
    if (title !== undefined) {
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
    }

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

    if (param.deleteAllFiles) {
      const relations = await this.prisma.canvasEntityRelation.findMany({
        where: { canvasId, deletedAt: null },
      });
      const entities = relations.map((r) => ({
        entityId: r.entityId,
        entityType: r.entityType as EntityType,
      }));
      this.logger.log(`Entities to be deleted: ${JSON.stringify(entities)}`);

      for (const entity of entities) {
        cleanups.push(
          this.deleteKnowledgeQueue.add(
            'deleteKnowledgeEntity',
            {
              uid: canvas.uid,
              entityId: entity.entityId,
              entityType: entity.entityType,
            },
            {
              jobId: entity.entityId,
              removeOnComplete: true,
              removeOnFail: true,
              attempts: 3,
            },
          ),
        );
      }
    }

    await Promise.all(cleanups);
  }

  async syncCanvasEntityRelation(canvasId: string) {
    const canvas = await this.prisma.canvas.findUnique({
      where: { canvasId },
    });
    if (!canvas) {
      throw new CanvasNotFoundError();
    }

    const ydoc = new Y.Doc();
    await this.collabService.loadDocument({
      document: ydoc,
      documentName: canvas.canvasId,
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

  /**
   * Delete entity nodes from all related canvases
   * @param entities
   */
  async deleteEntityNodesFromCanvases(entities: Entity[]) {
    this.logger.log(`Deleting entity nodes from canvases: ${JSON.stringify(entities)}`);

    // Find all canvases that have relations with these entities
    const relations = await this.prisma.canvasEntityRelation.findMany({
      where: {
        entityId: { in: entities.map((e) => e.entityId) },
        entityType: { in: entities.map((e) => e.entityType) },
        deletedAt: null,
      },
      distinct: ['canvasId'],
    });

    const canvasIds = relations.map((r) => r.canvasId);
    if (canvasIds.length === 0) {
      this.logger.log(`No related canvases found for entities: ${JSON.stringify(entities)}`);
      return;
    }
    this.logger.log(`Found related canvases: ${JSON.stringify(canvasIds)}`);

    // Load each canvas and remove the nodes
    const limit = pLimit(3);
    await Promise.all(
      canvasIds.map((canvasId) =>
        limit(async () => {
          const canvas = await this.prisma.canvas.findUnique({
            where: { canvasId },
          });
          if (!canvas) return;

          // Open connection to get the document
          const connection = await this.collabService.openDirectConnection(canvasId, {
            user: { uid: canvas.uid },
            entity: canvas,
            entityType: 'canvas',
          });

          // Remove nodes matching the entities
          connection.document.transact(() => {
            const nodes = connection.document.getArray('nodes');
            const toRemove: number[] = [];

            nodes.forEach((node: any, index: number) => {
              const entityId = node?.data?.entityId;
              const entityType = node?.type;

              if (entityId && entityType) {
                const matchingEntity = entities.find(
                  (e) => e.entityId === entityId && e.entityType === entityType,
                );
                if (matchingEntity) {
                  toRemove.push(index);
                }
              }
            });

            // Remove nodes in reverse order to maintain correct indices
            toRemove.reverse();
            for (const index of toRemove) {
              nodes.delete(index, 1);
            }
          });

          await connection.disconnect();

          // Update relations
          await this.prisma.canvasEntityRelation.updateMany({
            where: {
              canvasId,
              entityId: { in: entities.map((e) => e.entityId) },
              entityType: { in: entities.map((e) => e.entityType) },
              deletedAt: null,
            },
            data: { deletedAt: new Date() },
          });
        }),
      ),
    );
  }

  async autoNameCanvas(user: User, param: AutoNameCanvasRequest) {
    const { canvasId, directUpdate = false } = param;

    const canvas = await this.prisma.canvas.findFirst({
      where: { canvasId, uid: user.uid, deletedAt: null },
    });
    if (!canvas) {
      throw new CanvasNotFoundError();
    }

    const results = await this.prisma.actionResult.findMany({
      select: { title: true, input: true, version: true, resultId: true },
      where: { targetId: canvasId, targetType: 'canvas' },
    });

    const canvasContent = await Promise.all(
      results.map(async (result) => {
        const { resultId, version, input, title } = result;
        const steps = await this.prisma.actionStep.findMany({
          where: { resultId, version },
        });
        const parsedInput = JSON.parse(input ?? '{}');
        const question = parsedInput?.query ?? title;

        return `Question: ${question}\nAnswer: ${steps.map((s) => s.content.slice(0, 100)).join('\n')}`;
      }),
    );

    // If no action results, try to get all entities associated with the canvas
    if (canvasContent.length === 0) {
      const relations = await this.prisma.canvasEntityRelation.findMany({
        where: { canvasId, entityType: { in: ['resource', 'document'] }, deletedAt: null },
      });
      const documents = await this.prisma.document.findMany({
        select: { title: true, contentPreview: true },
        where: { docId: { in: relations.map((r) => r.entityId) } },
      });
      const resources = await this.prisma.resource.findMany({
        select: { title: true, contentPreview: true },
        where: { resourceId: { in: relations.map((r) => r.entityId) } },
      });
      canvasContent.push(
        ...documents.map((d) => `Title: ${d.title}\nContent Preview: ${d.contentPreview}`),
        ...resources.map((r) => `Title: ${r.title}\nContent Preview: ${r.contentPreview}`),
      );
    }

    const combinedContent = canvasContent.filter(Boolean).join('\n\n');

    if (!combinedContent) {
      return { title: '' };
    }

    const defaultModel = await this.subscriptionService.getDefaultModel();
    this.logger.log(`Using default model for auto naming: ${defaultModel?.name}`);

    const model = new ChatOpenAI({
      model: defaultModel?.name,
      apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
      configuration: {
        baseURL: process.env.OPENROUTER_API_KEY && 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://refly.ai',
          'X-Title': 'Refly',
        },
      },
    });

    const systemPrompt =
      'Given the following content from a canvas, generate a concise and descriptive title (maximum 5 words)';
    const result = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(combinedContent),
    ]);
    const newTitle = result.content.toString();

    if (directUpdate) {
      await this.updateCanvas(user, {
        canvasId,
        title: newTitle,
      });
    }

    return { title: newTitle };
  }

  async autoNameCanvasFromQueue(jobData: AutoNameCanvasJobData) {
    const { uid, canvasId } = jobData;
    const user = await this.prisma.user.findFirst({ where: { uid } });
    if (!user) {
      this.logger.warn(`user not found for uid ${uid} when auto naming canvas: ${canvasId}`);
      return;
    }

    const result = await this.autoNameCanvas(user, { canvasId, directUpdate: true });
    this.logger.log(`Auto named canvas ${canvasId} with title: ${result.title}`);
  }

  async listCanvasTemplates(user: User, param: ListCanvasTemplatesData['query']) {
    const { categoryId, scope, language, page, pageSize } = param;

    const where: Prisma.CanvasTemplateWhereInput = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (language) {
      where.language = language;
    }
    if (scope === 'private') {
      where.uid = user.uid;
    } else {
      where.isPublic = true;
    }

    const templates = await this.prisma.canvasTemplate.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { category: true },
    });

    return templates;
  }

  async createCanvasTemplate(user: User, param: CreateCanvasTemplateRequest) {
    const { categoryId, canvasId, title, description, language } = param;
    const userPo = await this.prisma.user.findFirst({ where: { uid: user.uid } });
    if (!userPo) {
      this.logger.warn(`user not found for uid ${user.uid} when creating canvas template`);
      return;
    }

    const shareUser: ShareUser = {
      uid: userPo.uid,
      name: userPo.name,
      avatar: userPo.avatar,
    };
    const template = await this.prisma.canvasTemplate.create({
      data: {
        categoryId,
        templateId: genCanvasTemplateID(),
        originCanvasId: canvasId,
        uid: userPo.uid,
        shareUser: JSON.stringify(shareUser),
        title,
        description,
        language,
      },
    });

    return template;
  }

  async updateCanvasTemplate(user: User, param: UpdateCanvasTemplateRequest) {
    const { templateId, title, description, language } = param;
    const template = await this.prisma.canvasTemplate.update({
      where: { templateId, uid: user.uid },
      data: { title, description, language },
    });
    return template;
  }

  async listCanvasTemplateCategories() {
    return this.prisma.canvasTemplateCategory.findMany();
  }
}
