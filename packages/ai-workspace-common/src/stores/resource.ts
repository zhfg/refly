import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import { persist, createJSONStorage } from 'zustand/middleware';

import { Resource } from '@refly/openapi-schema';
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
  setResource: (resource: Resource) => void;

  fetchResource: (resourceId: string, reindex?: boolean) => Promise<void>;
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

      setResource: (resource) =>
        set((state) => ({
          resource: {
            ...state.resource,
            data: resource,
          },
        })),

      fetchResource: async (resourceId, reindex = false) => {
        if (resourceId !== get().currentResourceId) {
          return;
        }

        if (!reindex) {
          set((state) => {
            state.resource.loading = true;
          });
        }

        const { data, error } = await getClient().getResourceDetail({
          query: { resourceId },
        });

        set((state) => {
          state.resource.loading = false;
          if (!reindex) {
            state.resource.data = data?.data || null;
          } else {
            state.resource.data = {
              ...state.resource.data,
              indexStatus: data?.data?.indexStatus,
            };
          }
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
