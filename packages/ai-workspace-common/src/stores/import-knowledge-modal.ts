import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension';

interface ImportKnowledgeModal {
  // state
  showNewKnowledgeModal: boolean;

  // method
  setShowNewKnowledgeModal: (val: boolean) => void;
}

export const useImportKnowledgeModal = create<ImportKnowledgeModal>()(
  devtools((set) => ({
    showNewKnowledgeModal: false,

    setShowNewKnowledgeModal: (val: boolean) => set({ showNewKnowledgeModal: val }),
  })),
);
