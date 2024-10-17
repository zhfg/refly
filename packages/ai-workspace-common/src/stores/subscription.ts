import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { StorageUsageMeter, SubscriptionPlanType, TokenUsageMeter } from '@refly/openapi-schema';

interface SubscriptionState {
  // state
  isRequest: boolean;
  subscriptionStatus: SubscriptionPlanType;
  tokenUsage: TokenUsageMeter;
  storageUsage: StorageUsageMeter;
  subscribeModalVisible: boolean;

  // method
  setIsRequest: (val: boolean) => void;
  setSubscriptionStatus: (val: SubscriptionPlanType) => void;
  setTokenUsage: (val: TokenUsageMeter) => void;
  setStorageUsage: (val: StorageUsageMeter) => void;
  setSubscribeModalVisible: (val: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  devtools((set) => ({
    isRequest: false,
    tokenUsage: null,
    storageUsage: null,
    subscriptionStatus: 'free',
    subscribeModalVisible: false,

    setIsRequest: (val: boolean) => set({ isRequest: val }),
    setTokenUsage: (val: TokenUsageMeter) => set({ tokenUsage: val }),
    setStorageUsage: (val: StorageUsageMeter) => set({ storageUsage: val }),
    setSubscriptionStatus: (val: SubscriptionPlanType) => set({ subscriptionStatus: val }),
    setSubscribeModalVisible: (val: boolean) => set({ subscribeModalVisible: val }),
  })),
);

export const useSubscriptionStoreShallow = <T>(selector: (state: SubscriptionState) => T) => {
  return useSubscriptionStore(useShallow(selector));
};
