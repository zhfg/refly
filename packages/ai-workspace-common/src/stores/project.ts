import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import { persist, createJSONStorage } from 'zustand/middleware';

import { Project } from '@refly/openapi-schema';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

export type ProjectDirListItemType = 'canvases' | 'resources' | 'conversations';

export interface ProjectDirListItem {
  id: string;
  title: string;
  type: ProjectDirListItemType;
  url?: string;
  order?: number;
}

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
  canvases: StateField<ProjectDirListItem[]>;
  resources: StateField<ProjectDirListItem[]>;
  conversations: StateField<ProjectDirListItem[]>;

  projectActiveTab: Record<string, string>;
  projectTabs: Record<string, ProjectTab[]>;
  projectActiveConvId: Record<string, string>;
  copilotSize: number;

  setProjectActiveConvId: (projectId: string, convId: string) => void;
  setCopilotSize: (size: number) => void;
  setCurrentProjectId: (projectId: string) => void;
  setProjectActiveTab: (projectId: string, tab: string) => void;
  setProjectTabs: (projectId: string, tabs: ProjectTab[]) => void;
  setProject: (project: Project) => void;
  setProjectDirItems: (projectId: string, itemType: ProjectDirListItemType, items: ProjectDirListItem[]) => void;
  updateProjectDirItem: (
    projectId: string,
    itemType: ProjectDirListItemType,
    itemId: string,
    updates: Partial<ProjectDirListItem>,
  ) => void;

  fetchProjectDetail: (projectId: string) => Promise<void>;
  fetchProjectDirItems: (projectId: string, itemType: ProjectDirListItemType) => Promise<void>;
  fetchProjectAll: (projectId: string) => Promise<void>;
}

interface FetchConfig {
  listMethod: 'listCanvas' | 'listResources' | 'listConversations';
  stateKey: ProjectDirListItemType;
  idField: string;
}

const FETCH_CONFIGS: Record<ProjectDirListItemType, FetchConfig> = {
  canvases: { listMethod: 'listCanvas', stateKey: 'canvases', idField: 'canvasId' },
  resources: { listMethod: 'listResources', stateKey: 'resources', idField: 'resourceId' },
  conversations: { listMethod: 'listConversations', stateKey: 'conversations', idField: 'convId' },
};

export const useProjectStore = create<ProjectState>()(
  persist(
    immer((set, get) => ({
      currentProjectId: '',
      copilotSize: 500,
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
      projectActiveConvId: {},

      setProjectActiveConvId: (projectId, convId) =>
        set((state) => {
          state.projectActiveConvId[projectId] = convId;
        }),
      setCopilotSize: (size) =>
        set((state) => {
          state.copilotSize = size;
        }),
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
      setProject: (project) =>
        set((state) => {
          state.project.data = project;
        }),
      setProjectDirItems: (projectId, itemType, items) =>
        set((state) => {
          if (projectId !== state.currentProjectId) return;
          state[itemType].data = items;
        }),
      updateProjectDirItem: (projectId, itemType, itemId, updates) =>
        set((state) => {
          if (projectId !== state.currentProjectId) return;
          const itemIndex = state[itemType].data?.findIndex((c) => c.id === itemId);
          if (itemIndex !== -1) {
            state[itemType].data[itemIndex] = { ...state[itemType].data[itemIndex], ...updates };
          }
        }),
      fetchProjectDetail: async (projectId) => {
        if (projectId !== get().currentProjectId) return;

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
      fetchProjectDirItems: async (projectId: string, itemType: ProjectDirListItemType) => {
        if (projectId !== get().currentProjectId) return;

        const config = FETCH_CONFIGS[itemType];

        set((state) => {
          state[config.stateKey].loading = true;
        });

        const { data, error } = await getClient()[config.listMethod]({
          query: { projectId, pageSize: 1000 },
        });

        set((state) => {
          state[config.stateKey].loading = false;
          state[config.stateKey].data = (data?.data || []).map((item) => ({
            id: item[config.idField],
            title: item.title,
            type: itemType,
            order: item.order,
            url: item.data?.url,
          }));
          if (error || !data?.success) {
            state[config.stateKey].error = String(error) || 'request not success';
          }
        });
      },
      fetchProjectAll: async (projectId) => {
        if (projectId !== get().currentProjectId) {
          return;
        }

        await Promise.all([
          get().fetchProjectDetail(projectId),
          get().fetchProjectDirItems(projectId, 'canvases'),
          get().fetchProjectDirItems(projectId, 'resources'),
          get().fetchProjectDirItems(projectId, 'conversations'),
        ]);
      },
    })),
    {
      name: 'project-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projectActiveTab: state.projectActiveTab,
        projectTabs: state.projectTabs,
        projectActiveConvId: state.projectActiveConvId,
      }),
    },
  ),
);

export const useProjectStoreShallow = <T>(selector: (state: ProjectState) => T) => {
  return useProjectStore(useShallow(selector));
};
