import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { Canvas } from '@refly/openapi-schema';
import { EditorInstance } from '@refly-packages/editor-core/components';

export enum ActionSource {
  KnowledgeBase = 'knowledge-base',
  Conv = 'conv',
  Canvas = 'canvas',
}

export interface CanvasTab {
  title: string;
  key: string;
  content: string;
  canvasId: string;
  projectId: string;
}

export type DocumentServerStatus = 'disconnected' | 'connected';
export type DocumentSaveStatus = 'Saved' | 'Unsaved';

export interface TableOfContentsItem {
  isActive: boolean;
  isScrolledOver: boolean;
  id: string;
  itemIndex: number;
  textContent: string;
}

interface DocumentBaseState {
  currentCanvas: Canvas | null;
  isRequesting: boolean;
  newCanvasCreating: boolean;
  isAiEditing: boolean;
  isCreatingNewCanvasOnHumanMessage: boolean;

  // tabs
  tabs: CanvasTab[];
  activeTab: string;
  canvasPanelVisible: boolean;

  // canvas
  editor: EditorInstance | null;
  canvasServerStatus: DocumentServerStatus;
  canvasCharsCount: number;
  canvasSaveStatus: DocumentSaveStatus;

  lastCursorPosRef: number | null;

  // tocItems
  tocItems: TableOfContentsItem[];

  updateCurrentCanvas: (canvas: Canvas) => void;
  updateIsRequesting: (isRequesting: boolean) => void;
  updateNewCanvasCreating: (creating: boolean) => void;
  updateIsCreatingNewCanvasOnHumanMessage: (creating: boolean) => void;
  updateIsAiEditing: (editing: boolean) => void;
  updateTabs: (tabs: CanvasTab[]) => void;
  updateActiveTab: (key: string) => void;
  updateCanvasPanelVisible: (visible: boolean) => void;
  updateCanvasServerStatus: (status: DocumentServerStatus) => void;
  updateCanvasSaveStatus: (status: DocumentSaveStatus) => void;
  updateCanvasCharsCount: (count: number) => void;
  updateEditor: (editor: EditorInstance) => void;

  updateLastCursorPosRef: (pos: number) => void;
  updateTocItems: (items: TableOfContentsItem[]) => void;

  resetState: () => void;
}

export const defaultState = {
  currentCanvas: null as null | Canvas,
  tabs: [],
  activeTab: 'key1',
  canvasPanelVisible: false,
  isRequesting: false,
  newCanvasCreating: false,
  isCreatingNewCanvasOnHumanMessage: false,
  isAiEditing: false,
  tocItems: [],

  // canvases
  editor: null,
  canvasServerStatus: 'disconnected' as DocumentServerStatus,
  canvasCharsCount: 0,
  canvasSaveStatus: 'Unsaved' as DocumentSaveStatus,

  // canvas selection status content, main for skill consume
  lastCursorPosRef: null,
};

export const useDocumentStore = create<DocumentBaseState>()(
  devtools((set) => ({
    ...defaultState,

    updateCurrentCanvas: (canvas) => set((state) => ({ ...state, currentCanvas: canvas })),
    updateIsRequesting: (isRequesting: boolean) => set((state) => ({ ...state, isRequesting })),
    updateTabs: (tabs: CanvasTab[]) => set((state) => ({ ...state, tabs })),
    updateActiveTab: (key: string) => set((state) => ({ ...state, activeTab: key })),
    updateNewCanvasCreating: (creating: boolean) => set((state) => ({ ...state, newCanvasCreating: creating })),
    updateIsCreatingNewCanvasOnHumanMessage: (creating: boolean) =>
      set((state) => ({ ...state, isCreatingNewCanvasOnHumanMessage: creating })),
    updateIsAiEditing: (editing: boolean) => set((state) => ({ ...state, isAiEditing: editing })),

    // tabs
    updateCanvasPanelVisible: (visible: boolean) => set((state) => ({ ...state, canvasPanelVisible: visible })),

    // canvases
    updateEditor: (editor: EditorInstance) => set((state) => ({ ...state, editor })),
    updateCanvasServerStatus: (status: DocumentServerStatus) =>
      set((state) => ({ ...state, canvasServerStatus: status })),
    updateCanvasSaveStatus: (status: DocumentSaveStatus) => set((state) => ({ ...state, canvasSaveStatus: status })),
    updateCanvasCharsCount: (count: number) => set((state) => ({ ...state, canvasCharsCount: count })),
    updateLastCursorPosRef: (pos: number) => set((state) => ({ ...state, lastCursorPosRef: pos })),
    updateTocItems: (items: TableOfContentsItem[]) => set((state) => ({ ...state, tocItems: items })),

    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);

export const useDocumentStoreShallow = <T>(selector: (state: DocumentBaseState) => T) => {
  return useDocumentStore(useShallow(selector));
};
