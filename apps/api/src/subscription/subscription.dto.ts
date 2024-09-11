import {
  SkillMeta,
  Subscription,
  SubscriptionPlanType,
  SubscriptionInterval,
  TokenUsageItem,
  SubscriptionStatus,
  TokenUsageMeter,
} from '@refly/openapi-schema';
import {
  Subscription as SubscriptionModel,
  TokenUsageMeter as TokenUsageMeterModel,
} from '@prisma/client';
import { pick } from '@/utils';

export interface CreateSubscriptionParam {
  subscriptionId: string;
  lookupKey: string;
  status: SubscriptionStatus;
  planType: SubscriptionPlanType;
  interval?: SubscriptionInterval;
}

export interface ReportTokenUsageJobData {
  uid: string;
  convId: string;
  jobId: string;
  spanId: string;
  skill: SkillMeta;
  usage: TokenUsageItem;
  timestamp: Date;
}

export function subscriptionPO2DTO(sub: SubscriptionModel): Subscription {
  return {
    ...pick(sub, ['subscriptionId', 'lookupKey']),
    planType: sub.planType as SubscriptionPlanType,
    interval: sub.interval as SubscriptionInterval,
    status: sub.status as SubscriptionStatus,
  };
}

export function tokenUsageMeterPO2DTO(usage: TokenUsageMeterModel): TokenUsageMeter {
  return {
    ...pick(usage, [
      'meterId',
      'uid',
      'subscriptionId',
      't1TokenQuota',
      't1TokenUsed',
      't2TokenQuota',
      't2TokenUsed',
    ]),
    startAt: usage.startAt.toJSON(),
    endAt: usage.endAt.toJSON(),
  };
}
