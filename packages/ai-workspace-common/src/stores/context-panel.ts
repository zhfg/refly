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
  contextPanelPopoverVisible: boolean;
  importPopoverVisible: boolean;

  // context 选中内容
  selectedResources: TreeProps['treeData'];
  selectedCollections: TreeProps['treeData'];
  selectedNotes: TreeProps['treeData'];

  // 处理记录去重后的选择 id
  treeData: TreeProps['treeData'];
  checkedKeys: string[];
  expandedKeys: string[];

  setContextPanelPopoverVisible: (visible: boolean) => void;
  setImportPopoverVisible: (visible: boolean) => void;
  setSelectedResources: (resources: TreeProps['treeData']) => void;
  setSelectedCollections: (collections: TreeProps['treeData']) => void;
  setSelectedNotes: (notes: TreeProps['treeData']) => void;
  setTreeData: (treeData: TreeProps['treeData']) => void;
  setCheckedKeys: (keys: string[]) => void;
  setExpandedKeys: (keys: string[]) => void;
  resetState: () => void;
}

export const defaultState = {
  contextPanelPopoverVisible: false,
  importPopoverVisible: false,
  selectedResources: [],
  selectedCollections: [],
  selectedNotes: [],
  allSelectedIds: [],
  treeData: [],
  checkedKeys: [],
  expandedKeys: [],
};

export const useContextPanelStore = create<ContextPanelState>()(
  devtools((set) => ({
    ...defaultState,

    setContextPanelPopoverVisible: (visible: boolean) =>
      set((state) => ({ ...state, contextPanelPopoverVisible: visible })),
    setImportPopoverVisible: (visible: boolean) => set((state) => ({ ...state, importPopoverVisible: visible })),
    setSelectedResources: (resources: SearchResult[]) => set((state) => ({ ...state, selectedResources: resources })),
    setSelectedCollections: (collections: SearchResult[]) =>
      set((state) => ({ ...state, selectedCollections: collections })),
    setSelectedNotes: (notes: SearchResult[]) => set((state) => ({ ...state, selectedNotes: notes })),
    setAllSelectedIds: (ids: string[]) => set((state) => ({ ...state, allSelectedIds: ids })),
    setTreeData: (treeData: TreeProps['treeData']) => set((state) => ({ ...state, treeData })),
    setCheckedKeys: (keys: string[]) => set((state) => ({ ...state, checkedKeys: keys })),
    setExpandedKeys: (keys: string[]) => set((state) => ({ ...state, expandedKeys: keys })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);
