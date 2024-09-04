import {
  SkillMeta,
  SubscriptionPlan,
  SubscriptionPlanType,
  SubscriptionInterval,
  TokenUsageItem,
} from '@refly/openapi-schema';
import { SubscriptionPlan as SubscriptionPlanModel } from '@prisma/client';

export interface CreateSubscriptionPlanParam {
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

export function subscriptionPlanPo2DTO(plan: SubscriptionPlanModel): SubscriptionPlan {
  return {
    planId: plan.planId,
    planType: plan.planType as SubscriptionPlanType,
    interval: plan.interval as SubscriptionInterval,
  };
}
