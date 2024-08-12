import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension';

interface ReloadListState {
  // state
  reloadResourceList: boolean;
  reloadKnowledgeBaseList: boolean;
  reloadNoteList: boolean;

  // method
  setReloadResourceList: (val: boolean) => void;
  setReloadKnowledgeBaseList: (val: boolean) => void;
  setReloadNoteList: (val: boolean) => void;
}

export const useReloadListState = create<ReloadListState>()(
  devtools((set) => ({
    reloadResourceList: false,
    reloadKnowledgeBaseList: false,
    reloadNoteList: false,

    setReloadResourceList: (val: boolean) => set({ reloadResourceList: val }),
    setReloadKnowledgeBaseList: (val: boolean) => set({ reloadKnowledgeBaseList: val }),
    setReloadNoteList: (val: boolean) => set({ reloadNoteList: val }),
  })),
);
