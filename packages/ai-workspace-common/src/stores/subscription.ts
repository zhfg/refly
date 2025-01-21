import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { StorageUsageMeter, SubscriptionPlanType, TokenUsageMeter } from '@refly/openapi-schema';

interface SubscriptionState {
  // state
  isRequest: boolean;
  planType: SubscriptionPlanType;
  tokenUsage: TokenUsageMeter;
  storageUsage: StorageUsageMeter;
  subscribeModalVisible: boolean;
  storageExceededModalVisible: boolean;

  // method
  setIsRequest: (val: boolean) => void;
  setPlanType: (val: SubscriptionPlanType) => void;
  setTokenUsage: (val: TokenUsageMeter) => void;
  setStorageUsage: (val: StorageUsageMeter) => void;
  setSubscribeModalVisible: (val: boolean) => void;
  setStorageExceededModalVisible: (val: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  devtools((set) => ({
    isRequest: false,
    tokenUsage: null,
    storageUsage: null,
    planType: 'free',
    subscribeModalVisible: false,
    storageExceededModalVisible: false,

    setIsRequest: (val: boolean) => set({ isRequest: val }),
    setTokenUsage: (val: TokenUsageMeter) => set({ tokenUsage: val }),
    setStorageUsage: (val: StorageUsageMeter) => set({ storageUsage: val }),
    setPlanType: (val: SubscriptionPlanType) => set({ planType: val }),
    setSubscribeModalVisible: (val: boolean) => set({ subscribeModalVisible: val }),
    setStorageExceededModalVisible: (val: boolean) => set({ storageExceededModalVisible: val }),
  })),
);

export const useSubscriptionStoreShallow = <T>(selector: (state: SubscriptionState) => T) => {
  return useSubscriptionStore(useShallow(selector));
};
