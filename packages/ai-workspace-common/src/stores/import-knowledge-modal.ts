import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension';
// 类型
import { Collection } from '@refly/openapi-schema';

interface ImportKnowledgeModal {
  // state
  showNewKnowledgeModal: boolean;
  editCollection?: Collection | null;

  // method
  setShowNewKnowledgeModal: (val: boolean) => void;
  setEditCollection: (val: Collection | null) => void;
}

export const useImportKnowledgeModal = create<ImportKnowledgeModal>()(
  devtools((set) => ({
    showNewKnowledgeModal: false,
    editCollection: null,

    setShowNewKnowledgeModal: (val: boolean) => set({ showNewKnowledgeModal: val }),
    setEditCollection: (state: Collection | null) => set({ editCollection: state ? { ...state } : null }),
  })),
);
