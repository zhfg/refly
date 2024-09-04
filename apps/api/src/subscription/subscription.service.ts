import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { ModelTier, User } from '@refly/openapi-schema';
import { genSubscriptionPlanID, genUsageMeterID } from '@refly/utils';
import {
  CreateSubscriptionPlanParam,
  ReportTokenUsageJobData,
} from '@/subscription/subscription.dto';
import { pick } from '@/utils';
import { SubscriptionPlan } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrInitSubscriptionPlan(user: User) {
    if (!user.planId) {
      return this.createSubscriptionPlan(user, { planType: 'free' });
    }

    return this.prisma.subscriptionPlan.findUnique({
      where: { planId: user.planId },
    });
  }

  async createSubscriptionPlan(user: User, param: CreateSubscriptionPlanParam) {
    const { planType = 'free', interval } = param;

    // Check for existing plan
    const currentPlan = await this.prisma.subscriptionPlan.findFirst({
      where: {
        uid: user.uid,
        anulledAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (currentPlan) {
      // If the plan is same, return it
      if (currentPlan.planType === planType) {
        return currentPlan;
      }

      // If current plan is free and new plan is not free, annul the free plan
      if (currentPlan.planType === 'free' && planType !== 'free') {
        await this.annulSubscriptionPlan(user, currentPlan.planId, `Upgraded to ${planType}`);
      }
    }

    // Create a new plan if needed
    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        planType,
        interval,
        uid: user.uid,
        planId: genSubscriptionPlanID(),
      },
    });

    // Update user's planId
    await this.prisma.user.update({
      where: { uid: user.uid },
      data: { planId: plan.planId },
    });

    // Create a new usage meter for this plan
    await this.createUsageMeter(user, plan, false);

    return plan;
  }

  async annulSubscriptionPlan(user: User, planId: string, annulmentReason: string) {
    const { uid } = user;
    const plan = await this.prisma.subscriptionPlan.update({
      where: {
        uid,
        planId,
        anulledAt: null,
      },
      data: {
        anulledAt: new Date(),
        annulmentReason,
      },
    });
    return plan;
  }

  async checkTokenUsage(user: User, param: { modelTier: ModelTier }) {
    const { uid } = user;
    const { modelTier } = param;

    let activeMeter = await this.prisma.usageMeter.findFirst({
      where: {
        uid,
        startAt: { lte: new Date() },
        endAt: { gte: new Date() },
        deletedAt: null,
      },
    });

    // Compensate for the case where the usage meter is not found.
    // Typically, the usage meter is automatically resumed with cronjobs, so this should be rare.
    if (!activeMeter) {
      activeMeter = await this.createUsageMeter(user, null, true);
    }

    return modelTier === 't1'
      ? activeMeter.t1TokenUsed < activeMeter.t1TokenQuota
      : activeMeter.t2TokenUsed < activeMeter.t2TokenQuota;
  }

  async createUsageMeter(user: User, plan?: SubscriptionPlan, resumeLastMeter?: boolean) {
    const { uid } = user;

    plan ??= await this.getOrInitSubscriptionPlan(user);

    // Find the token quota for the plan
    const tokenQuota = await this.prisma.subscriptionUsageQuota.findUnique({
      where: { planType: plan.planType },
    });

    // Try to find the last usage meter. If we find it, resume from there.
    let startAt: Date;

    if (resumeLastMeter) {
      const lastMeter = await this.prisma.usageMeter.findFirst({
        where: {
          uid,
          deletedAt: null,
        },
        orderBy: {
          startAt: 'desc',
        },
      });
      startAt = lastMeter?.endAt ?? startOfDay(new Date());
    } else {
      startAt = startOfDay(new Date());
    }

    return this.prisma.usageMeter.create({
      data: {
        meterId: genUsageMeterID(),
        uid,
        planId: plan.planId,
        startAt,
        endAt: new Date(startAt.getFullYear(), startAt.getMonth() + 1, startAt.getDate()),
        t1TokenQuota: tokenQuota?.t1TokenQuota || 0,
        t1TokenUsed: 0,
        t2TokenQuota: tokenQuota?.t2TokenQuota || 0,
        t2TokenUsed: 0,
      },
    });
  }

  async updateTokenUsage(data: ReportTokenUsageJobData) {
    const { uid, usage, skill, timestamp } = data;

    await this.prisma.$transaction([
      this.prisma.tokenUsage.create({
        data: {
          ...pick(data, ['uid', 'convId', 'jobId', 'spanId']),
          ...pick(usage, ['tier', 'modelProvider', 'modelName', 'inputTokens', 'outputTokens']),
          skillId: skill.skillId,
          skillTplName: skill.tplName,
          skillDisplayName: skill.displayName,
        },
      }),
      this.prisma.usageMeter.updateMany({
        where: {
          uid,
          startAt: { lte: timestamp },
          endAt: { gte: timestamp },
          deletedAt: null,
        },
        data: {
          [usage.tier === 't1' ? 't1TokenUsed' : 't2TokenUsed']: {
            increment: usage.inputTokens + usage.outputTokens,
          },
        },
      }),
    ]);
  }
}

const startOfDay = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};
