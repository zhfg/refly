import { PriceLookupKey, SubscriptionInterval, SubscriptionPlanType } from '@refly-packages/openapi-schema';

export type SubscriptionInfo = {
  planType: SubscriptionPlanType;
  interval: SubscriptionInterval;
};

export const getSubscriptionInfoFromLookupKey = (lookupKey: PriceLookupKey): SubscriptionInfo => {
  switch (lookupKey) {
    case 'refly_pro_monthly':
      return { planType: 'pro', interval: 'monthly' };
    case 'refly_pro_yearly':
      return { planType: 'pro', interval: 'yearly' };
    default:
      throw new Error(`Invalid lookup key: ${lookupKey}`);
  }
};
