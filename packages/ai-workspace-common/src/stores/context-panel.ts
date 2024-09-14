import { TreeNodeProps, TreeProps } from '@arco-design/web-react';
import { SearchDomain, SearchResult } from '@refly/openapi-schema';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Mark, ContextDomain, SelectedTextDomain } from '@refly/common-types';

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

export const selectedTextCardDomainWeb = [
  {
    key: 'resource',
    labelDict: {
      en: 'Resource',
      'zh-CN': '资源',
    },
  },
  {
    key: 'note',
    labelDict: {
      en: 'Note',
      'zh-CN': '笔记',
    },
  },
  {
    key: 'noteCursorSelection',
    labelDict: {
      en: 'Note Cursor Selection',
      'zh-CN': '选中文本',
    },
  },
  {
    key: 'noteBeforeCursorSelection',
    labelDict: {
      en: 'Note Before Cursor Selection',
      'zh-CN': '选中文本前',
    },
  },
  {
    key: 'noteAfterCursorSelection',
    labelDict: {
      en: 'Note After Cursor Selection',
      'zh-CN': '选中文本后',
    },
  },
];

export const selectedTextCardDomainExtension = [
  {
    key: 'extensionWeblink',
    labelDict: {
      en: 'Web Link',
      'zh-CN': '网页链接',
    },
  },
];

export const defaultSelectedTextCardDomainKeysWeb: SelectedTextDomain[] = selectedTextCardDomainWeb.map(
  (item) => item.key as SelectedTextDomain,
);
export const defaultSelectedTextCardDomainKeysExtension: SelectedTextDomain[] = selectedTextCardDomainExtension.map(
  (item) => item.key as SelectedTextDomain,
);

interface ContextPanelState {
  envContextInitMap: { resource: boolean; collection: boolean; note: boolean };

  contextPanelPopoverVisible: boolean;
  importPopoverVisible: boolean;

  // context 选中内容
  selectedResources: TreeProps['treeData'];
  selectedCollections: TreeProps['treeData'];
  selectedNotes: TreeProps['treeData'];
  // extension only
  selectedWeblinks: TreeProps['treeData'];

  // 处理记录去重后的选择 id
  treeData: TreeProps['treeData'];
  checkedKeys: string[];
  expandedKeys: string[];

  // context card 的处理
  nowSelectedContextDomain: SearchDomain;

  // selected text card, suuport multi selected as it is all selected text
  selectedTextCardDomain: SelectedTextDomain[];
  // selection text
  currentSelectedMark: Mark;
  selectedDomain: SelectedTextDomain;
  enableMultiSelect: boolean; // 支持多选
  currentSelectedMarks: Mark[]; // 多选内容

  // context card
  showContextCard: boolean;
  contextDomain: ContextDomain;

  // note cursor selection
  beforeSelectionNoteContent: string;
  afterSelectionNoteContent: string;
  currentSelectionContent: string;

  setEnvContextInitMap: (envContextInitMap: Partial<{ resource: boolean; collection: boolean; note: boolean }>) => void;
  setContextPanelPopoverVisible: (visible: boolean) => void;
  setImportPopoverVisible: (visible: boolean) => void;
  setSelectedResources: (resources: TreeProps['treeData']) => void;
  setSelectedCollections: (collections: TreeProps['treeData']) => void;
  setSelectedNotes: (notes: TreeProps['treeData']) => void;
  setSelectedWeblinks: (weblinks: TreeProps['treeData']) => void;
  setTreeData: (treeData: TreeProps['treeData']) => void;
  setCheckedKeys: (keys: string[]) => void;
  setExpandedKeys: (keys: string[]) => void;

  // selected text context 面板相关的内容
  updateCurrentSelectedMark: (mark: Mark) => void;
  updateSelectedDomain: (domain: SelectedTextDomain) => void;
  updateEnableMultiSelect: (enableMultiSelect: boolean) => void;
  updateCurrentSelectedMarks: (marks: Mark[]) => void;
  resetSelectedTextCardState: () => void;
  setSelectedTextCardDomain: (domain: SelectedTextDomain[]) => void;

  // context card
  setShowContextCard: (showcontextCard: boolean) => void;
  setContextDomain: (contextDomain: ContextDomain) => void;
  setNowSelectedContextDomain: (domain: SearchDomain) => void;

  // note cursor selection
  updateBeforeSelectionNoteContent: (content: string) => void;
  updateAfterSelectionNoteContent: (content: string) => void;
  updateCurrentSelectionContent: (content: string) => void;

  resetState: () => void;
}

export const defaultSelectedTextCardState = {
  currentSelectedMark: null as Mark,
  selectedDomain: 'resource' as SelectedTextDomain,
  enableMultiSelect: true, // default enable multi select, later to see if we need to enable multiSelect ability
  currentSelectedMarks: [] as Mark[],
};

export const defaultCurrentContext = {
  contextDomain: 'resource' as ContextDomain,
  showContextCard: false, // 插件状态下自动打开
};

// not add to currentSelectedMarks as it cannot delete, only can unselect
export const defaultNoteCursorSelection = {
  beforeSelectionNoteContent: '',
  afterSelectionNoteContent: '',
  currentSelectionContent: '',
};

export const defaultState = {
  envContextInitMap: { resource: false, collection: false, note: false },
  nowSelectedContextDomain: 'resource' as SearchDomain,
  contextPanelPopoverVisible: false,
  importPopoverVisible: false,
  selectedResources: [],
  selectedCollections: [],
  selectedNotes: [],
  selectedWeblinks: [],
  allSelectedIds: [],
  treeData: [],
  checkedKeys: [],
  expandedKeys: [],

  // selected text card
  selectedTextCardDomain: [] as SelectedTextDomain[],
  ...defaultSelectedTextCardState,
  ...defaultCurrentContext,
  ...defaultNoteCursorSelection,
};

export const useContextPanelStore = create<ContextPanelState>()(
  devtools((set) => ({
    ...defaultState,

    setEnvContextInitMap: (envContextInitMap: { resource: boolean; collection: boolean; note: boolean }) =>
      set((state) => ({ ...state, envContextInitMap: { ...state.envContextInitMap, ...envContextInitMap } })),
    setContextPanelPopoverVisible: (visible: boolean) =>
      set((state) => ({ ...state, contextPanelPopoverVisible: visible })),
    setImportPopoverVisible: (visible: boolean) => set((state) => ({ ...state, importPopoverVisible: visible })),
    setSelectedResources: (resources: SearchResult[]) => set((state) => ({ ...state, selectedResources: resources })),
    setSelectedCollections: (collections: SearchResult[]) =>
      set((state) => ({ ...state, selectedCollections: collections })),
    setSelectedWeblinks: (weblinks: SearchResult[]) => set((state) => ({ ...state, selectedWeblinks: weblinks })),
    setSelectedNotes: (notes: SearchResult[]) => set((state) => ({ ...state, selectedNotes: notes })),
    setAllSelectedIds: (ids: string[]) => set((state) => ({ ...state, allSelectedIds: ids })),
    setTreeData: (treeData: TreeProps['treeData']) => set((state) => ({ ...state, treeData })),
    setCheckedKeys: (keys: string[]) => set((state) => ({ ...state, checkedKeys: keys })),
    setExpandedKeys: (keys: string[]) => set((state) => ({ ...state, expandedKeys: keys })),
    setNowSelectedContextDomain: (domain: SearchDomain) =>
      set((state) => ({ ...state, nowSelectedContextDomain: domain })),
    setSelectedTextCardDomain: (domain: SelectedTextDomain[]) =>
      set((state) => ({ ...state, selectedTextCardDomain: domain })),

    // selected text
    updateCurrentSelectedMark: (mark: Mark) => set((state) => ({ ...state, currentSelectedMark: mark })),
    updateSelectedDomain: (selectedDomain: SelectedTextDomain) => set((state) => ({ ...state, selectedDomain })),
    updateEnableMultiSelect: (enableMultiSelect: boolean) => set((state) => ({ ...state, enableMultiSelect })),
    updateCurrentSelectedMarks: (marks: Mark[]) => set((state) => ({ ...state, currentSelectedMarks: marks })),

    resetSelectedTextCardState: () => set((state) => ({ ...state, ...defaultSelectedTextCardState })),

    // context card
    setContextDomain: (contextDomain: ContextDomain) => set((state) => ({ ...state, contextDomain })),
    setShowContextCard: (showContextCard: boolean) => set((state) => ({ ...state, showContextCard })),

    // note cursor selection
    updateBeforeSelectionNoteContent: (content: string) =>
      set((state) => ({ ...state, beforeSelectionNoteContent: content })),
    updateAfterSelectionNoteContent: (content: string) =>
      set((state) => ({ ...state, afterSelectionNoteContent: content })),
    updateLastCursorPosRef: (pos: number) => set((state) => ({ ...state, lastCursorPosRef: pos })),
    updateCurrentSelectionContent: (content: string) =>
      set((state) => ({ ...state, currentSelectionContent: content })),

    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);
