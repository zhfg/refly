import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import { persist, createJSONStorage } from 'zustand/middleware';

import { Project } from '@refly/openapi-schema';

export interface ProjectTab {
  key: string;
  title: string;
  projectId: string;
  type: 'canvas' | 'resource';
}

export interface ProjectState {
  isFetching: boolean;
  currentProject: Project | null;
  projectActiveTab: Record<string, string>;
  projectTabs: Record<string, ProjectTab[]>;

  setIsFetching: (isFetching: boolean) => void;
  setCurrentProject: (project: Project) => void;
  setProjectActiveTab: (projectId: string, tab: string) => void;
  setProjectTabs: (projectId: string, tabs: ProjectTab[]) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    immer((set) => ({
      isFetching: false,
      currentProject: null,
      projectActiveTab: {},
      projectTabs: {},

      setIsFetching: (isFetching) =>
        set((state) => {
          state.isFetching = isFetching;
        }),
      setCurrentProject: (project) =>
        set((state) => {
          state.currentProject = project;
        }),
      setProjectActiveTab: (projectId, tab) =>
        set((state) => {
          state.projectActiveTab[projectId] = tab;
        }),
      setProjectTabs: (projectId, tabs) =>
        set((state) => {
          state.projectTabs[projectId] = tabs;
        }),
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
