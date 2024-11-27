import { TreeProps } from '@arco-design/web-react';
import { ActionResult, SearchDomain, SearchResult } from '@refly/openapi-schema';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { Mark, ContextDomain, SelectedTextDomain } from '@refly/common-types';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';

export const selectedTextCardDomainWeb = [
  {
    key: 'resourceSelection',
    labelDict: {
      en: 'Resource',
      'zh-CN': '资源选中',
    },
  },
  {
    key: 'noteSelection',
    labelDict: {
      en: 'Note',
      'zh-CN': '笔记选中',
    },
  },
  {
    key: 'noteCursorSelection',
    labelDict: {
      en: 'Note Cursor Selection',
      'zh-CN': '笔记光标选中文本',
    },
  },
  {
    key: 'noteBeforeCursorSelection',
    labelDict: {
      en: 'Note Before Cursor Selection',
      'zh-CN': '笔记光标选中前文本',
    },
  },
  {
    key: 'noteAfterCursorSelection',
    labelDict: {
      en: 'Note After Cursor Selection',
      'zh-CN': '笔记光标选中后文本',
    },
  },
];

export const selectedTextCardDomainExtension = [
  {
    key: 'extensionWeblinkSelection',
    labelDict: {
      en: 'Web Link',
      'zh-CN': '网页链选中',
    },
  },
];

export const defaultSelectedTextCardDomainKeysWeb: SelectedTextDomain[] = selectedTextCardDomainWeb.map(
  (item) => item.key as SelectedTextDomain,
);
export const defaultSelectedTextCardDomainKeysExtension: SelectedTextDomain[] = selectedTextCardDomainExtension.map(
  (item) => item.key as SelectedTextDomain,
);

export interface IContextItem extends CanvasNode<any> {
  isPreview?: boolean; // is preview mode
  isCurrentContext?: boolean;
}

export interface IResultItem extends ActionResult {
  isPreview?: boolean; // is preview mode
}

interface ContextPanelState {
  envContextInitMap: { resource: boolean; collection: boolean; note: boolean };

  contextPanelPopoverVisible: boolean;
  importPopoverVisible: boolean;

  // Canvas selected nodes
  selectedContextItems: IContextItem[];

  // Canvas selected result items
  selectedResultItems: IResultItem[];

  // context card 的处理
  nowSelectedContextDomain: SearchDomain;

  // selected text card, suuport multi selected as it is all selected text
  selectedTextCardDomain: SelectedTextDomain[];
  // selection text
  currentSelectedMark: Mark;
  selectedDomain: SelectedTextDomain;
  enableMultiSelect: boolean; // 支持多选

  currentSelectedMarks: Mark[]; // 作为唯一的 context items 来源
  filterIdsOfCurrentSelectedMarks: string[]; // 作为 context items 的过滤
  filterErrorInfo: { [key: string]: { limit: number; currentCount: number; required?: boolean } }; // 作为 context items 的过滤错误信息
  formErrors: Record<string, string>;

  // context card
  showContextCard: boolean;
  contextDomain: ContextDomain;

  // note cursor selection
  beforeSelectionNoteContent: string;
  afterSelectionNoteContent: string;
  currentSelectionContent: string;

  setContextPanelPopoverVisible: (visible: boolean) => void;
  setImportPopoverVisible: (visible: boolean) => void;
  setCheckedKeys: (keys: string[]) => void;
  setExpandedKeys: (keys: string[]) => void;

  // selected text context 面板相关的内容
  updateCurrentSelectedMark: (mark: Mark) => void;
  updateSelectedDomain: (domain: SelectedTextDomain) => void;
  updateEnableMultiSelect: (enableMultiSelect: boolean) => void;
  updateCurrentSelectedMarks: (marks: Mark[]) => void;
  updateFilterIdsOfCurrentSelectedMarks: (ids: string[]) => void;
  resetSelectedTextCardState: () => void;
  setSelectedTextCardDomain: (domain: SelectedTextDomain[]) => void;
  updateFilterErrorInfo: (errorInfo: {
    [key: string]: { limit: number; currentCount: number; required?: boolean };
  }) => void;
  setFormErrors: (errors: Record<string, string>) => void;

  // context card
  setShowContextCard: (showcontextCard: boolean) => void;
  setContextDomain: (contextDomain: ContextDomain) => void;
  setNowSelectedContextDomain: (domain: SearchDomain) => void;

  // note cursor selection
  updateBeforeSelectionNoteContent: (content: string) => void;
  updateAfterSelectionNoteContent: (content: string) => void;
  updateCurrentSelectionContent: (content: string) => void;

  resetState: () => void;

  // 新增的操作方法
  addMark: (mark: Mark) => void;
  removeMark: (id: string) => void;
  toggleMarkActive: (id: string) => void;
  clearMarks: () => void;
  updateMark: (mark: Mark) => void;

  addContextItem: (node: IContextItem) => void;
  setContextItems: (nodes: IContextItem[]) => void;
  removeContextItem: (id: string) => void;
  clearContextItems: () => void;
  updateContextItem: (node: IContextItem) => void;

  addResultItem: (item: IResultItem) => void;
  setResultItems: (items: IResultItem[]) => void;
  removeResultItem: (id: string) => void;
  removePreviewResultItem: () => void;
  clearResultItems: () => void;
  updateResultItem: (item: IResultItem) => void;
}

export const defaultSelectedTextCardState = {
  currentSelectedMark: null as Mark,
  selectedDomain: 'resource' as SelectedTextDomain,
  enableMultiSelect: true, // default enable multi select, later to see if we need to enable multiSelect ability
  currentSelectedMarks: [] as Mark[],
  filterIdsOfCurrentSelectedMarks: [] as string[],
  filterErrorInfo: {} as { [key: string]: { limit: number; currentCount: number; required?: boolean } },
  formErrors: {} as Record<string, string>,
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
  selectedResultItems: [],
  selectedContextItems: [],
  allSelectedIds: [],
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

    setContextPanelPopoverVisible: (visible: boolean) =>
      set((state) => ({ ...state, contextPanelPopoverVisible: visible })),
    setImportPopoverVisible: (visible: boolean) => set((state) => ({ ...state, importPopoverVisible: visible })),
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
    updateFilterIdsOfCurrentSelectedMarks: (ids: string[]) =>
      set((state) => ({ ...state, filterIdsOfCurrentSelectedMarks: ids })),
    updateFilterErrorInfo: (errorInfo: {
      [key: string]: { limit: number; currentCount: number; required?: boolean };
    }) => set((state) => ({ ...state, filterErrorInfo: errorInfo })),
    setFormErrors: (errors: Record<string, string>) => set((state) => ({ ...state, formErrors: errors })),

    addMark: (mark: Mark) =>
      set((state) => ({ ...state, currentSelectedMarks: [...state.currentSelectedMarks, mark] })),
    removeMark: (id: string) =>
      set((state) => ({ ...state, currentSelectedMarks: state.currentSelectedMarks.filter((mark) => mark.id !== id) })),
    toggleMarkActive: (id: string) =>
      set((state) => ({
        ...state,
        currentSelectedMarks: state.currentSelectedMarks.map((mark) => ({
          ...mark,
          active: mark.id === id ? !mark.active : false,
        })),
      })),
    clearMarks: () => set((state) => ({ ...state, currentSelectedMarks: [] })),
    updateMark: (mark: Mark) =>
      set((state) => ({
        ...state,
        currentSelectedMarks: state.currentSelectedMarks.map((item) =>
          item.id === mark.id ? { ...item, ...mark } : item,
        ),
      })),

    addContextItem: (node: CanvasNode) =>
      set((state) => {
        const existingIndex = state.selectedContextItems.findIndex((item) => item.id === node.id);

        if (existingIndex >= 0) {
          // Update existing item
          const updatedItems = [...state.selectedContextItems];
          updatedItems[existingIndex] = node;
          return {
            ...state,
            selectedContextItems: updatedItems,
          };
        }

        // Add new item to end
        return {
          ...state,
          selectedContextItems: [...state.selectedContextItems, node],
        };
      }),
    setContextItems: (nodes: CanvasNode[]) => set((state) => ({ ...state, selectedContextItems: nodes })),
    removeContextItem: (id: string) =>
      set((state) => ({
        ...state,
        selectedContextItems: state.selectedContextItems.filter((node) => node.id !== id),
      })),
    clearContextItems: () => set((state) => ({ ...state, selectedContextItems: [] })),
    updateContextItem: (node: CanvasNode) =>
      set((state) => ({
        ...state,
        selectedContextItems: state.selectedContextItems.map((item) =>
          item.id === node.id ? { ...item, ...node } : item,
        ),
      })),

    addResultItem: (item: IResultItem) =>
      set((state) => {
        const existingIndex = state.selectedResultItems.findIndex((existing) => existing.resultId === item.resultId);

        if (existingIndex >= 0) {
          // Update existing item
          const updatedItems = [...state.selectedResultItems];
          updatedItems[existingIndex] = item;
          return {
            ...state,
            selectedResultItems: updatedItems,
          };
        }

        return {
          ...state,
          selectedResultItems: item.isPreview
            ? [item, ...state.selectedResultItems]
            : [...state.selectedResultItems, item],
        };
      }),
    setResultItems: (items: IResultItem[]) => set((state) => ({ ...state, selectedResultItems: items })),
    removeResultItem: (id: string) =>
      set((state) => ({
        ...state,
        selectedResultItems: state.selectedResultItems.filter((node) => node.resultId !== id),
      })),
    removePreviewResultItem: () =>
      set((state) => ({
        ...state,
        selectedResultItems: state.selectedResultItems.filter((node) => !node.isPreview),
      })),
    clearResultItems: () => set((state) => ({ ...state, selectedResultItems: [] })),
    updateResultItem: (result: IResultItem) =>
      set((state) => ({
        ...state,
        selectedResultItems: state.selectedResultItems.map((item) =>
          item.resultId === result.resultId ? { ...item, ...result } : item,
        ),
      })),

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

export const useContextPanelStoreShallow = <T>(selector: (state: ContextPanelState) => T) => {
  return useContextPanelStore(useShallow(selector));
};
