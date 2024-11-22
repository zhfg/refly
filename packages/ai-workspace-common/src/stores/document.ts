import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { Document } from '@refly/openapi-schema';
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
  currentDocument: Document | null;
  isRequesting: boolean;
  newDocumentCreating: boolean;
  isAiEditing: boolean;
  isCreatingNewDocumentOnHumanMessage: boolean;

  // tabs
  tabs: CanvasTab[];
  activeTab: string;
  canvasPanelVisible: boolean;

  // canvas
  editor: EditorInstance | null;
  documentServerStatus: DocumentServerStatus;
  documentCharsCount: number;
  documentSaveStatus: DocumentSaveStatus;

  lastCursorPosRef: number | null;

  // tocItems
  tocItems: TableOfContentsItem[];

  updateCurrentDocument: (document: Document) => void;
  updateIsRequesting: (isRequesting: boolean) => void;
  updateNewDocumentCreating: (creating: boolean) => void;
  updateIsCreatingNewDocumentOnHumanMessage: (creating: boolean) => void;
  updateIsAiEditing: (editing: boolean) => void;
  updateTabs: (tabs: CanvasTab[]) => void;
  updateActiveTab: (key: string) => void;
  updateCanvasPanelVisible: (visible: boolean) => void;
  updateDocumentServerStatus: (status: DocumentServerStatus) => void;
  updateDocumentSaveStatus: (status: DocumentSaveStatus) => void;
  updateDocumentCharsCount: (count: number) => void;
  updateEditor: (editor: EditorInstance) => void;

  updateLastCursorPosRef: (pos: number) => void;
  updateTocItems: (items: TableOfContentsItem[]) => void;

  resetState: () => void;
}

export const defaultState = {
  currentDocument: null as null | Document,
  tabs: [],
  activeTab: 'key1',
  canvasPanelVisible: false,
  isRequesting: false,
  newDocumentCreating: false,
  isCreatingNewDocumentOnHumanMessage: false,
  isAiEditing: false,
  tocItems: [],

  // canvases
  editor: null,
  documentServerStatus: 'disconnected' as DocumentServerStatus,
  documentCharsCount: 0,
  documentSaveStatus: 'Unsaved' as DocumentSaveStatus,

  // canvas selection status content, main for skill consume
  lastCursorPosRef: null,
};

export const useDocumentStore = create<DocumentBaseState>()(
  devtools((set) => ({
    ...defaultState,

    updateCurrentDocument: (document: Document) => set((state) => ({ ...state, currentDocument: document })),
    updateIsRequesting: (isRequesting: boolean) => set((state) => ({ ...state, isRequesting })),
    updateTabs: (tabs: CanvasTab[]) => set((state) => ({ ...state, tabs })),
    updateActiveTab: (key: string) => set((state) => ({ ...state, activeTab: key })),
    updateNewDocumentCreating: (creating: boolean) => set((state) => ({ ...state, newDocumentCreating: creating })),
    updateIsCreatingNewDocumentOnHumanMessage: (creating: boolean) =>
      set((state) => ({ ...state, isCreatingNewDocumentOnHumanMessage: creating })),
    updateIsAiEditing: (editing: boolean) => set((state) => ({ ...state, isAiEditing: editing })),

    // tabs
    updateCanvasPanelVisible: (visible: boolean) => set((state) => ({ ...state, canvasPanelVisible: visible })),

    // canvases
    updateEditor: (editor: EditorInstance) => set((state) => ({ ...state, editor })),
    updateDocumentServerStatus: (status: DocumentServerStatus) =>
      set((state) => ({ ...state, documentServerStatus: status })),
    updateDocumentSaveStatus: (status: DocumentSaveStatus) =>
      set((state) => ({ ...state, documentSaveStatus: status })),
    updateDocumentCharsCount: (count: number) => set((state) => ({ ...state, documentCharsCount: count })),
    updateLastCursorPosRef: (pos: number) => set((state) => ({ ...state, lastCursorPosRef: pos })),
    updateTocItems: (items: TableOfContentsItem[]) => set((state) => ({ ...state, tocItems: items })),

    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);

export const useDocumentStoreShallow = <T>(selector: (state: DocumentBaseState) => T) => {
  return useDocumentStore(useShallow(selector));
};
