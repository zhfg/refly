import { TreeNodeProps, TreeProps } from '@arco-design/web-react';
import { SearchResult } from '@refly/openapi-schema';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface LinkMeta {
  key: string;
  url: string;
  title?: string;
  image?: string;
  description?: string;
  html?: string;
  isHandled?: boolean; // 已经爬取
  isError?: boolean; // 处理失败
}

interface ContextPanelState {
  selectedResources: TreeProps['treeData'];
  selectedCollections: TreeProps['treeData'];
  selectedNotes: TreeProps['treeData'];

  setSelectedResources: (resources: TreeProps['treeData']) => void;
  setSelectedCollections: (collections: TreeProps['treeData']) => void;
  setSelectedNotes: (notes: TreeProps['treeData']) => void;
  resetState: () => void;
}

export const defaultState = {
  selectedResources: [],
  selectedCollections: [],
  selectedNotes: [],
};

export const useContextPanelStore = create<ContextPanelState>()(
  devtools((set) => ({
    ...defaultState,

    setSelectedResources: (resources: SearchResult[]) => set((state) => ({ ...state, selectedResources: resources })),
    setSelectedCollections: (collections: SearchResult[]) =>
      set((state) => ({ ...state, selectedCollections: collections })),
    setSelectedNotes: (notes: SearchResult[]) => set((state) => ({ ...state, selectedNotes: notes })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);
