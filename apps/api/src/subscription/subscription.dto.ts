import {
  SkillMeta,
  Subscription,
  SubscriptionPlanType,
  SubscriptionInterval,
  TokenUsageItem,
  SubscriptionStatus,
} from '@refly/openapi-schema';
import { Subscription as SubscriptionModel } from '@prisma/client';

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

export function subscriptionPo2DTO(sub: SubscriptionModel): Subscription {
  return {
    subscriptionId: sub.subscriptionId,
    lookupKey: sub.lookupKey,
    planType: sub.planType as SubscriptionPlanType,
    interval: sub.interval as SubscriptionInterval,
    status: sub.status as SubscriptionStatus,
  };
}
