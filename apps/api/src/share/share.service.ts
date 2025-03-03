import { Injectable, Logger } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { PrismaService } from '@/common/prisma.service';
import { MiscService } from '@/misc/misc.service';
import {
  CreateShareRequest,
  CreateShareResult,
  DeleteShareRequest,
  ListSharesData,
  User,
} from '@refly-packages/openapi-schema';
import { ParamsError, ShareNotFoundError } from '@refly-packages/errors';
import { CanvasService } from '@/canvas/canvas.service';
import { KnowledgeService } from '@/knowledge/knowledge.service';
import { ActionService } from '@/action/action.service';
import { actionResultPO2DTO } from '@/action/action.dto';
import { documentPO2DTO, resourcePO2DTO } from '@/knowledge/knowledge.dto';

const SHARE_CODE_PREFIX = {
  document: 'doc-',
  canvas: 'can-',
  resource: 'res-',
  skillResponse: 'skr-',
};

function genShareId(entityType: keyof typeof SHARE_CODE_PREFIX): string {
  return SHARE_CODE_PREFIX[entityType] + createId();
}

@Injectable()
export class ShareService {
  private logger = new Logger(ShareService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly miscService: MiscService,
    private readonly canvasService: CanvasService,
    private readonly knowledgeService: KnowledgeService,
    private readonly actionService: ActionService,
  ) {}

  async listShares(user: User, param: ListSharesData['query']) {
    const { shareId, entityId, entityType } = param;

    const shares = await this.prisma.shareRecord.findMany({
      where: { shareId, entityId, entityType, uid: user.uid, deletedAt: null },
    });

    return shares;
  }

  async createShareForCanvas(user: User, param: CreateShareRequest) {
    const { entityId: canvasId, parentShareId, allowDuplication } = param;
    const shareId = genShareId('canvas');

    const canvas = await this.prisma.canvas.findUnique({
      where: { canvasId, uid: user.uid, deletedAt: null },
    });

    if (!canvas) {
      throw new ShareNotFoundError();
    }

    const canvasData = await this.canvasService.getCanvasRawData(user, canvasId);

    for (const node of canvasData.nodes) {
      if (node.type === 'image') {
        const storageKey = node.data.metadata?.storageKey as string;
        if (storageKey) {
          try {
            node.data.metadata.imageUrl = await this.miscService.publishFile(storageKey);
          } catch (error) {
            this.logger.warn(`Failed to publish image ${storageKey}: ${error?.stack}`);
          }
        }
      } else if (node.type === 'document') {
        const result = await this.createShareForDocument(user, {
          entityId: node.data.entityId,
          entityType: 'document',
          parentShareId: shareId,
          allowDuplication,
        });

        node.data.metadata.shareId = result.shareId;
      } else if (node.type === 'resource') {
        const result = await this.createShareForResource(user, {
          entityId: node.data.entityId,
          entityType: 'resource',
          parentShareId: shareId,
          allowDuplication,
        });

        node.data.metadata.shareId = result.shareId;
      } else if (node.type === 'skillResponse') {
        const result = await this.createShareForSkillResponse(user, {
          entityId: node.data.entityId,
          entityType: 'skillResponse',
          parentShareId: shareId,
          allowDuplication,
        });

        node.data.metadata.shareId = result.shareId;
      }
    }

    // Upload public canvas data to Minio
    const { storageKey } = await this.miscService.uploadBuffer(user, {
      fpath: 'canvas.json',
      buf: Buffer.from(JSON.stringify(canvasData)),
      entityId: canvasId,
      entityType: 'canvas',
      visibility: 'public',
      storageKey: `share/${shareId}.json`,
    });

    const shareRecord = await this.prisma.shareRecord.create({
      data: {
        shareId,
        uid: user.uid,
        entityId: canvasId,
        entityType: 'canvas',
        storageKey,
        parentShareId,
        allowDuplication,
      },
    });

    return shareRecord;
  }

  async createShareForDocument(user: User, param: CreateShareRequest) {
    const { entityId: documentId, parentShareId, allowDuplication } = param;

    const shareId = genShareId('document');

    const documentDetail = await this.knowledgeService.getDocumentDetail(user, {
      docId: documentId,
    });
    const document = documentPO2DTO(documentDetail);

    // TODO: process document images

    const { storageKey } = await this.miscService.uploadBuffer(user, {
      fpath: 'document.json',
      buf: Buffer.from(JSON.stringify(document)),
      entityId: documentId,
      entityType: 'document',
      visibility: 'public',
      storageKey: `share/${shareId}.json`,
    });

    const shareRecord = await this.prisma.shareRecord.create({
      data: {
        shareId,
        uid: user.uid,
        entityId: documentId,
        entityType: 'document',
        storageKey,
        parentShareId,
        allowDuplication,
      },
    });

    return shareRecord;
  }

  async createShareForResource(user: User, param: CreateShareRequest) {
    const { entityId: resourceId, parentShareId, allowDuplication } = param;
    const shareId = genShareId('resource');

    const resourceDetail = await this.knowledgeService.getResourceDetail(user, {
      resourceId,
    });
    const resource = resourcePO2DTO(resourceDetail);

    // TODO: process resource images

    const { storageKey } = await this.miscService.uploadBuffer(user, {
      fpath: 'resource.json',
      buf: Buffer.from(JSON.stringify(resource)),
      entityId: resourceId,
      entityType: 'resource',
      visibility: 'public',
      storageKey: `share/${shareId}.json`,
    });

    const shareRecord = await this.prisma.shareRecord.create({
      data: {
        shareId,
        uid: user.uid,
        entityId: resourceId,
        entityType: 'resource',
        storageKey,
        parentShareId,
        allowDuplication,
      },
    });

    return shareRecord;
  }

  async createShareForSkillResponse(user: User, param: CreateShareRequest) {
    const { entityId: resultId, parentShareId, allowDuplication } = param;
    const shareId = genShareId('skillResponse');

    const actionResultDetail = await this.actionService.getActionResult(user, {
      resultId,
    });
    const actionResult = actionResultPO2DTO(actionResultDetail);

    const { storageKey } = await this.miscService.uploadBuffer(user, {
      fpath: 'skillResponse.json',
      buf: Buffer.from(JSON.stringify(actionResult)),
      entityId: resultId,
      entityType: 'skillResponse',
      visibility: 'public',
      storageKey: `share/${shareId}.json`,
    });

    const shareRecord = await this.prisma.shareRecord.create({
      data: {
        shareId,
        uid: user.uid,
        entityId: resultId,
        entityType: 'skillResponse',
        storageKey,
        parentShareId,
        allowDuplication,
      },
    });

    return shareRecord;
  }

  async createShare(user: User, req: CreateShareRequest): Promise<CreateShareResult> {
    switch (req.entityType) {
      case 'canvas':
        return this.createShareForCanvas(user, req);
      case 'document':
        return this.createShareForDocument(user, req);
      case 'resource':
        return this.createShareForResource(user, req);
      case 'skillResponse':
        return this.createShareForSkillResponse(user, req);
      default:
        throw new ParamsError(`Unsupported entity type ${req.entityType} for sharing`);
    }
  }

  async deleteShare(user: User, body: DeleteShareRequest) {
    const { shareId } = body;
    const result = await this.prisma.shareRecord.updateMany({
      where: { shareId, uid: user.uid, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    // TODO: delete all public files

    if (result.count === 0) {
      throw new ShareNotFoundError();
    }
  }
}
