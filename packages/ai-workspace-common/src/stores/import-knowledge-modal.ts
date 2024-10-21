import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { Project } from '@refly/openapi-schema';

interface ImportKnowledgeModal {
  // state
  showNewKnowledgeModal: boolean;
  editProject?: Project | null;

  // method
  setShowNewKnowledgeModal: (val: boolean) => void;
  setEditProject: (val: Project | null) => void;
}

export const useImportKnowledgeModal = create<ImportKnowledgeModal>()(
  devtools((set) => ({
    showNewKnowledgeModal: false,
    editProject: null,

    setShowNewKnowledgeModal: (val: boolean) => set({ showNewKnowledgeModal: val }),
    setEditProject: (state: Project | null) => set({ editProject: state ? { ...state } : null }),
  })),
);

export const useImportKnowledgeModalShallow = <T>(selector: (state: ImportKnowledgeModal) => T) => {
  return useImportKnowledgeModal(useShallow(selector));
};
