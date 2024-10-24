import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import { persist, createJSONStorage } from 'zustand/middleware';

import { Canvas, Conversation, Project, Resource } from '@refly/openapi-schema';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

export interface ProjectTab {
  key: string;
  title: string;
  projectId: string;
  type: 'canvas' | 'resource';
}

export type StateField<T> = {
  data: T;
  loading: boolean;
  error?: Error | string;
};

export interface ProjectState {
  currentProjectId: string;

  project: StateField<Project | null>;
  canvases: StateField<Canvas[]>;
  resources: StateField<Resource[]>;
  conversations: StateField<Conversation[]>;

  projectActiveTab: Record<string, string>;
  projectTabs: Record<string, ProjectTab[]>;

  setCurrentProjectId: (projectId: string) => void;
  setProjectActiveTab: (projectId: string, tab: string) => void;
  setProjectTabs: (projectId: string, tabs: ProjectTab[]) => void;

  fetchProjectDetail: (projectId: string) => Promise<void>;
  fetchProjectCanvases: (projectId: string) => Promise<void>;
  fetchProjectResources: (projectId: string) => Promise<void>;
  fetchProjectConversations: (projectId: string) => Promise<void>;
  fetchProjectAll: (projectId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    immer((set, get) => ({
      currentProjectId: '',
      project: {
        data: null,
        loading: false,
      },
      canvases: {
        data: [],
        loading: false,
      },
      resources: {
        data: [],
        loading: false,
      },
      conversations: {
        data: [],
        loading: false,
      },

      projectActiveTab: {},
      projectTabs: {},

      setCurrentProjectId: (projectId) =>
        set((state) => {
          state.currentProjectId = projectId;
        }),
      setProjectActiveTab: (projectId, tab) =>
        set((state) => {
          state.projectActiveTab[projectId] = tab;
        }),
      setProjectTabs: (projectId, tabs) =>
        set((state) => {
          state.projectTabs[projectId] = tabs;
        }),
      fetchProjectDetail: async (projectId) => {
        if (projectId !== get().currentProjectId) {
          return;
        }

        set((state) => {
          state.project.loading = true;
        });
        const { data, error } = await getClient().getProjectDetail({
          query: { projectId },
        });

        set((state) => {
          state.project.loading = false;
          state.project.data = data?.data || null;
          if (error || !data?.success) {
            state.project.error = String(error) || 'request not success';
          }
        });
      },
      fetchProjectCanvases: async (projectId) => {
        if (projectId !== get().currentProjectId) {
          return;
        }

        set((state) => {
          state.canvases.loading = true;
        });

        const { data, error } = await getClient().listCanvas({
          query: { projectId, pageSize: 50 },
        });

        set((state) => {
          state.canvases.loading = false;
          state.canvases.data = data?.data || [];
          if (error || !data?.success) {
            state.canvases.error = String(error) || 'request not success';
          }
        });
      },
      fetchProjectResources: async (projectId) => {
        if (projectId !== get().currentProjectId) {
          return;
        }

        set((state) => {
          state.resources.loading = true;
        });

        const { data, error } = await getClient().listResources({
          query: { projectId, pageSize: 50 },
        });

        set((state) => {
          state.resources.loading = false;
          state.resources.data = data?.data || [];
          if (error || !data?.success) {
            state.resources.error = String(error) || 'request not success';
          }
        });
      },
      fetchProjectConversations: async (projectId) => {
        if (projectId !== get().currentProjectId) {
          return;
        }

        set((state) => {
          state.conversations.loading = true;
        });

        const { data, error } = await getClient().listConversations({
          query: { projectId, pageSize: 50 },
        });

        set((state) => {
          state.conversations.loading = false;
          state.conversations.data = data?.data || [];
          if (error || !data?.success) {
            state.conversations.error = String(error) || 'request not success';
          }
        });
      },
      fetchProjectAll: async (projectId) => {
        if (projectId !== get().currentProjectId) {
          return;
        }

        await Promise.all([
          get().fetchProjectDetail(projectId),
          get().fetchProjectCanvases(projectId),
          get().fetchProjectResources(projectId),
          get().fetchProjectConversations(projectId),
        ]);
      },
    })),
    {
      name: 'project-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projectActiveTab: state.projectActiveTab,
        projectTabs: state.projectTabs,
      }),
    },
  ),
);

export const useProjectStoreShallow = <T>(selector: (state: ProjectState) => T) => {
  return useProjectStore(useShallow(selector));
};
