import { PrismaService } from '@/common/prisma.service';
import { SubscriptionService } from '@/subscription/subscription.service';
import { Injectable } from '@nestjs/common';
import { ActionResultNotFoundError } from '@refly-packages/errors';
import { GetActionResultData, User } from '@refly-packages/openapi-schema';
import { genActionResultID, pick } from '@refly-packages/utils';

@Injectable()
export class ActionService {
  constructor(
    private readonly prisma: PrismaService,
    private subscriptionService: SubscriptionService,
  ) {}

  async getActionResult(user: User | null, param: GetActionResultData['query']) {
    const { resultId, version } = param;

    const result = await this.prisma.actionResult.findFirst({
      where: {
        resultId,
        version,
      },
      orderBy: { version: 'desc' },
    });
    if (!result) {
      throw new ActionResultNotFoundError();
    }

    if (!user || user.uid !== result.uid) {
      const shareRels = await this.prisma.canvasEntityRelation.count({
        where: {
          entityId: result.resultId,
          entityType: 'skillResponse',
          isPublic: true,
          deletedAt: null,
        },
      });

      if (shareRels === 0) {
        throw new ActionResultNotFoundError();
      }
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
    resultId: string,
    options?: { checkOwnership?: boolean },
  ) {
    // Get the latest version of the action result
    const originalResult = await this.prisma.actionResult.findFirst({
      where: {
        resultId,
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
        resultId,
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
          'targetType',
          'targetId',
          'actionMeta',
          'input',
          'context',
          'status',
          'errors',
        ]),
        resultId: genActionResultID(),
        uid: user.uid,
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
