import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import { persist, createJSONStorage } from 'zustand/middleware';

import { Project, Resource } from '@refly/openapi-schema';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

export interface ResourceTab {
  key: string;
  title: string;
  resourceId: string;
}

export type StateField<T> = {
  data: T;
  loading: boolean;
  error?: Error | string;
};

export interface ResourceState {
  currentResourceId: string;

  resource: StateField<Resource | null>;

  setCurrentResourceId: (resourceId: string) => void;

  fetchResource: (resourceId: string) => Promise<void>;
}

export const useResourceStore = create<ResourceState>()(
  persist(
    immer((set, get) => ({
      currentResourceId: '',
      resource: {
        data: null,
        loading: false,
      },

      setCurrentResourceId: (resourceId) =>
        set((state) => {
          state.currentResourceId = resourceId;
        }),

      fetchResource: async (resourceId) => {
        if (resourceId !== get().currentResourceId) {
          return;
        }

        set((state) => {
          state.resource.loading = true;
        });

        const { data, error } = await getClient().getResourceDetail({
          query: { resourceId },
        });

        set((state) => {
          state.resource.loading = false;
          state.resource.data = data?.data || null;
          if (error || !data?.success) {
            state.resource.error = String(error) || 'request not success';
          }
        });
      },
    })),
    {
      name: 'resource-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentResourceId: state.currentResourceId,
      }),
    },
  ),
);

export const useResourceStoreShallow = <T>(selector: (state: ResourceState) => T) => {
  return useResourceStore(useShallow(selector));
};
