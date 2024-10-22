import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension';

interface ReloadListState {
  // state
  reloadResourceList: boolean;
  reloadKnowledgeBaseList: boolean;
  reloadCanvasList: boolean;
  reloadResourceDetail: boolean;

  // method
  setReloadResourceList: (val: boolean) => void;
  setReloadKnowledgeBaseList: (val: boolean) => void;
  setReloadCanvasList: (val: boolean) => void;
  setReloadResourceDetail: (val: boolean) => void;
}

export const useReloadListState = create<ReloadListState>()(
  devtools((set) => ({
    reloadResourceList: false,
    reloadKnowledgeBaseList: false,
    reloadCanvasList: false,
    reloadResourceDetail: false,

    setReloadResourceList: (val: boolean) => set({ reloadResourceList: val }),
    setReloadKnowledgeBaseList: (val: boolean) => set({ reloadKnowledgeBaseList: val }),
    setReloadCanvasList: (val: boolean) => set({ reloadCanvasList: val }),
    setReloadResourceDetail: (val: boolean) => set({ reloadResourceDetail: val }),
  })),
);

export const useReloadListStateShallow = <T>(selector: (state: ReloadListState) => T): T => {
  const state = useReloadListState();
  return selector(state);
};
