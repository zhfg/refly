import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { Mark } from '@refly/common-types';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';

export interface FilterErrorInfo {
  [key: string]: {
    limit: number;
    currentCount: number;
    required?: boolean;
  };
}

export interface NodeItem extends CanvasNode<any> {
  isPreview?: boolean; // is preview mode
  isCurrentContext?: boolean;
}

interface ContextPanelState {
  // Canvas selected context items
  contextItems: NodeItem[];

  // selection text
  currentSelectedMark: Mark;
  enableMultiSelect: boolean;

  currentSelectedMarks: Mark[]; // 作为唯一的 context items 来源
  filterErrorInfo: FilterErrorInfo;
  formErrors: Record<string, string>;

  // selected text context 面板相关的内容
  updateCurrentSelectedMark: (mark: Mark) => void;
  updateEnableMultiSelect: (enableMultiSelect: boolean) => void;
  updateCurrentSelectedMarks: (marks: Mark[]) => void;
  updateFilterErrorInfo: (errorInfo: FilterErrorInfo) => void;
  setFormErrors: (errors: Record<string, string>) => void;

  resetState: () => void;

  addContextItem: (node: NodeItem) => void;
  setContextItems: (nodes: NodeItem[]) => void;
  removeContextItem: (id: string) => void;
  clearContextItems: () => void;
  updateContextItem: (node: NodeItem) => void;
}

export const defaultSelectedTextCardState = {
  currentSelectedMark: null as Mark,
  enableMultiSelect: true, // default enable multi select, later to see if we need to enable multiSelect ability
  currentSelectedMarks: [] as Mark[],
  filterErrorInfo: {} as FilterErrorInfo,
  formErrors: {} as Record<string, string>,
};

export const defaultState = {
  contextPanelPopoverVisible: false,
  importPopoverVisible: false,
  contextItems: [],
  checkedKeys: [],
  expandedKeys: [],

  ...defaultSelectedTextCardState,
};

export const useContextPanelStore = create<ContextPanelState>()(
  devtools((set) => ({
    ...defaultState,

    // selected text
    updateCurrentSelectedMark: (mark: Mark) => set((state) => ({ ...state, currentSelectedMark: mark })),
    updateEnableMultiSelect: (enableMultiSelect: boolean) => set((state) => ({ ...state, enableMultiSelect })),
    updateCurrentSelectedMarks: (marks: Mark[]) => set((state) => ({ ...state, currentSelectedMarks: marks })),
    updateFilterErrorInfo: (errorInfo: FilterErrorInfo) =>
      set((state) => ({ ...state, filterErrorInfo: { ...state.filterErrorInfo, ...errorInfo } })),
    setFormErrors: (errors: Record<string, string>) => set((state) => ({ ...state, formErrors: errors })),

    addContextItem: (node: CanvasNode) =>
      set((state) => {
        const existingIndex = state.contextItems.findIndex((item) => item.id === node.id);

        if (existingIndex >= 0) {
          // Update existing item
          const updatedItems = [...state.contextItems];
          updatedItems[existingIndex] = node;
          return {
            ...state,
            contextItems: updatedItems,
          };
        }

        // Add new item to end
        return {
          ...state,
          contextItems: [...state.contextItems, node],
        };
      }),
    setContextItems: (nodes: CanvasNode[]) => set((state) => ({ ...state, contextItems: nodes })),
    removeContextItem: (id: string) =>
      set((state) => ({
        ...state,
        contextItems: state.contextItems.filter((node) => node.id !== id),
      })),
    clearContextItems: () => set((state) => ({ ...state, contextItems: [] })),
    updateContextItem: (node: CanvasNode) =>
      set((state) => ({
        ...state,
        contextItems: state.contextItems.map((item) => (item.id === node.id ? { ...item, ...node } : item)),
      })),

    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);

export const useContextPanelStoreShallow = <T>(selector: (state: ContextPanelState) => T) => {
  return useContextPanelStore(useShallow(selector));
};
