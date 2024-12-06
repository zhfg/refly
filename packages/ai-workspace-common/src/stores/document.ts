import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { Document } from '@refly/openapi-schema';
import { EditorInstance } from '@refly-packages/ai-workspace-common/components/editor/core/components';

export enum ActionSource {
  KnowledgeBase = 'knowledge-base',
  Conv = 'conv',
  Canvas = 'canvas',
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

interface DocumentState {
  editor: EditorInstance | null;
  documentServerStatus: DocumentServerStatus;
  documentCharsCount: number;
  documentSaveStatus: DocumentSaveStatus;
  lastCursorPosRef: number | null;
  tocItems: TableOfContentsItem[];
  currentDocument: Document | null;
}

const defaultDocumentState = {
  documentServerStatus: 'disconnected' as DocumentServerStatus,
  documentSaveStatus: 'Unsaved' as DocumentSaveStatus,
};

interface DocumentBaseState {
  newDocumentCreating: boolean;
  isAiEditing: boolean;
  isCreatingNewDocumentOnHumanMessage: boolean;

  // Canvas specific states stored by docId
  documentStates: Record<string, DocumentState>;

  updateCurrentDocument: (docId: string, document: Document) => void;
  updateDocumentServerStatus: (docId: string, status: DocumentServerStatus) => void;
  updateDocumentSaveStatus: (docId: string, status: DocumentSaveStatus) => void;
  updateDocumentCharsCount: (docId: string, count: number) => void;
  updateLastCursorPosRef: (docId: string, pos: number) => void;
  updateTocItems: (docId: string, items: TableOfContentsItem[]) => void;
  updateNewDocumentCreating: (creating: boolean) => void;
  updateIsCreatingNewDocumentOnHumanMessage: (creating: boolean) => void;
  updateIsAiEditing: (editing: boolean) => void;
  updateEditor: (docId: string, editor: EditorInstance) => void;

  resetState: (docId: string) => void;
}

export const defaultState = {
  newDocumentCreating: false,
  isCreatingNewDocumentOnHumanMessage: false,
  isAiEditing: false,
  editor: null,

  // documents
  documentStates: {},
};

export const useDocumentStore = create<DocumentBaseState>()(
  devtools((set) => ({
    ...defaultState,

    updateCurrentDocument: (docId: string, document: Document) =>
      set((state) => ({
        ...state,
        documentStates: {
          ...state.documentStates,
          [docId]: { ...state.documentStates[docId], currentDocument: document },
        },
      })),

    updateEditor: (docId: string, editor: EditorInstance) =>
      set((state) => ({
        ...state,
        documentStates: { ...state.documentStates, [docId]: { ...state.documentStates[docId], editor } },
      })),

    updateDocumentServerStatus: (docId: string, status: DocumentServerStatus) =>
      set((state) => ({
        ...state,
        documentStates: {
          ...state.documentStates,
          [docId]: { ...state.documentStates[docId], documentServerStatus: status },
        },
      })),

    updateDocumentSaveStatus: (docId: string, status: DocumentSaveStatus) =>
      set((state) => ({
        ...state,
        documentStates: {
          ...state.documentStates,
          [docId]: { ...state.documentStates[docId], documentSaveStatus: status },
        },
      })),

    updateDocumentCharsCount: (docId: string, count: number) =>
      set((state) => ({
        ...state,
        documentStates: {
          ...state.documentStates,
          [docId]: { ...state.documentStates[docId], documentCharsCount: count },
        },
      })),

    updateLastCursorPosRef: (docId: string, pos: number) =>
      set((state) => ({
        ...state,
        documentStates: { ...state.documentStates, [docId]: { ...state.documentStates[docId], lastCursorPosRef: pos } },
      })),

    updateTocItems: (docId: string, items: TableOfContentsItem[]) =>
      set((state) => ({
        ...state,
        documentStates: { ...state.documentStates, [docId]: { ...state.documentStates[docId], tocItems: items } },
      })),

    updateNewDocumentCreating: (creating: boolean) => set((state) => ({ ...state, newDocumentCreating: creating })),

    updateIsCreatingNewDocumentOnHumanMessage: (creating: boolean) =>
      set((state) => ({ ...state, isCreatingNewDocumentOnHumanMessage: creating })),

    updateIsAiEditing: (editing: boolean) => set((state) => ({ ...state, isAiEditing: editing })),

    resetState: (docId: string) =>
      set((state) => ({
        ...state,
        documentStates: {
          ...state.documentStates,
          [docId]: { ...state.documentStates[docId], ...defaultDocumentState },
        },
      })),
  })),
);

export const useDocumentStoreShallow = <T>(selector: (state: DocumentBaseState) => T) => {
  return useDocumentStore(useShallow(selector));
};
