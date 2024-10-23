import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { Project } from '@refly/openapi-schema';

interface ImportProjectModal {
  // state
  showNewProjectModal: boolean;
  editProject?: Project | null;

  // method
  setShowNewProjectModal: (val: boolean) => void;
  setEditProject: (val: Project | null) => void;
}

export const useImportProjectModal = create<ImportProjectModal>()(
  devtools((set) => ({
    showNewProjectModal: false,
    editProject: null,

    setShowNewProjectModal: (val: boolean) => set({ showNewProjectModal: val }),
    setEditProject: (state: Project | null) => set({ editProject: state ? { ...state } : null }),
  })),
);

export const useImportProjectModalShallow = <T>(selector: (state: ImportProjectModal) => T) => {
  return useImportProjectModal(useShallow(selector));
};
