import { ActionDetail } from '@/action/action.dto';
import { PrismaService } from '@/common/prisma.service';
import { SubscriptionService } from '@/subscription/subscription.service';
import { Injectable } from '@nestjs/common';
import { ActionResultNotFoundError } from '@refly-packages/errors';
import { EntityType, GetActionResultData, User } from '@refly-packages/openapi-schema';
import { genActionResultID, pick } from '@refly-packages/utils';

@Injectable()
export class ActionService {
  constructor(
    private readonly prisma: PrismaService,
    private subscriptionService: SubscriptionService,
  ) {}

  async getActionResult(user: User, param: GetActionResultData['query']): Promise<ActionDetail> {
    const { resultId, version } = param;

    const result = await this.prisma.actionResult.findFirst({
      where: {
        resultId,
        version,
        uid: user.uid,
      },
      orderBy: { version: 'desc' },
    });
    if (!result) {
      throw new ActionResultNotFoundError();
    }

    // If the result is executing and the last updated time is more than 3 minutes ago,
    // mark it as failed.
    if (result.status === 'executing' && result.updatedAt < new Date(Date.now() - 1000 * 60 * 3)) {
      const updatedResult = await this.prisma.actionResult.update({
        where: {
          pk: result.pk,
          status: 'executing',
        },
        data: {
          status: 'failed',
          errors: `["Execution timeout"]`,
        },
      });
      return updatedResult;
    }

    const modelList = await this.subscriptionService.getModelList();
    const modelInfo = modelList.find((model) => model.name === result.modelName);

    const steps = await this.prisma.actionStep.findMany({
      where: {
        resultId: result.resultId,
        version: result.version,
        deletedAt: null,
      },
      orderBy: { order: 'asc' },
    });

    return { ...result, steps, modelInfo };
  }

  async duplicateActionResult(
    user: User,
    param: {
      sourceResultId: string;
      targetId: string;
      targetType: EntityType;
    },
    options?: { checkOwnership?: boolean },
  ) {
    const { sourceResultId, targetId, targetType } = param;
    // Get the latest version of the action result
    const originalResult = await this.prisma.actionResult.findFirst({
      where: {
        resultId: sourceResultId,
      },
      orderBy: { version: 'desc' },
    });

    if (!originalResult) {
      throw new ActionResultNotFoundError();
    }

    // Check if the user has access to the result
    if (options?.checkOwnership && user.uid !== originalResult.uid) {
      const shareRels = await this.prisma.canvasEntityRelation.count({
        where: {
          entityId: originalResult.resultId,
          entityType: 'skillResponse',
          isPublic: true,
          deletedAt: null,
        },
      });

      if (shareRels === 0) {
        throw new ActionResultNotFoundError();
      }
    }

    // Get the original steps
    const originalSteps = await this.prisma.actionStep.findMany({
      where: {
        resultId: originalResult.resultId,
        version: originalResult.version,
        deletedAt: null,
      },
      orderBy: { order: 'asc' },
    });

    // Create new action result with a new resultId
    const newResult = await this.prisma.actionResult.create({
      data: {
        ...pick(originalResult, [
          'type',
          'title',
          'tier',
          'modelName',
          'actionMeta',
          'input',
          'context',
          'status',
          'errors',
        ]),
        resultId: genActionResultID(),
        uid: user.uid,
        targetId,
        targetType,
      },
    });

    // Create new steps for the duplicated result
    if (originalSteps?.length > 0) {
      await this.prisma.actionStep.createMany({
        data: originalSteps.map((step) => ({
          ...pick(step, [
            'order',
            'name',
            'content',
            'reasoningContent',
            'structuredData',
            'logs',
            'artifacts',
            'tokenUsage',
          ]),
          resultId: newResult.resultId,
        })),
      });
    }

    return newResult;
  }
}
