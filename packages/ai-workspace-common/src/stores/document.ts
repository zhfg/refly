import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { Document } from '@refly/openapi-schema';
import { EditorInstance } from '@refly-packages/ai-workspace-common/components/editor/core/components';

export enum ActionSource {
  KnowledgeBase = 'knowledge-base',
  Conv = 'conv',
  Canvas = 'canvas',
}

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
  documentCharsCount: number;
  documentSaveStatus: DocumentSaveStatus;
  lastCursorPosRef: number | null;
  tocItems: TableOfContentsItem[];
  currentDocument: Document | null;
}

interface DocumentConfig {
  localSyncedAt?: number;
  remoteSyncedAt?: number;
}

const defaultDocumentState = {
  documentSaveStatus: 'Unsaved' as DocumentSaveStatus,
};

interface DocumentBaseState {
  newDocumentCreating: boolean;
  isCreatingNewDocumentOnHumanMessage: boolean;

  // Canvas specific states stored by docId
  activeDocumentId: string;
  documentStates: Record<string, DocumentState>;
  config: Record<string, DocumentConfig>;

  updateCurrentDocument: (docId: string, document: Document) => void;
  updateDocumentSaveStatus: (docId: string, status: DocumentSaveStatus) => void;
  updateDocumentCharsCount: (docId: string, count: number) => void;
  updateLastCursorPosRef: (docId: string, pos: number) => void;
  updateTocItems: (docId: string, items: TableOfContentsItem[]) => void;
  updateNewDocumentCreating: (creating: boolean) => void;
  updateIsCreatingNewDocumentOnHumanMessage: (creating: boolean) => void;
  updateEditor: (docId: string, editor: EditorInstance) => void;
  setActiveDocumentId: (docId: string) => void;

  setDocumentLocalSyncedAt: (docId: string, syncedAt: number) => void;
  setDocumentRemoteSyncedAt: (docId: string, syncedAt: number) => void;

  resetState: (docId: string) => void;
}

export const defaultState = {
  newDocumentCreating: false,
  isCreatingNewDocumentOnHumanMessage: false,
  editor: null,

  // documents
  documentStates: {},
  activeDocumentId: '',
  config: {},
};

export const useDocumentStore = create<DocumentBaseState>()(
  persist(
    (set) => ({
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
          documentStates: {
            ...state.documentStates,
            [docId]: { ...state.documentStates[docId], lastCursorPosRef: pos },
          },
        })),

      updateTocItems: (docId: string, items: TableOfContentsItem[]) =>
        set((state) => ({
          ...state,
          documentStates: { ...state.documentStates, [docId]: { ...state.documentStates[docId], tocItems: items } },
        })),

      updateNewDocumentCreating: (creating: boolean) => set((state) => ({ ...state, newDocumentCreating: creating })),

      updateIsCreatingNewDocumentOnHumanMessage: (creating: boolean) =>
        set((state) => ({ ...state, isCreatingNewDocumentOnHumanMessage: creating })),

      setActiveDocumentId: (docId: string) => set((state) => ({ ...state, activeDocumentId: docId })),

      setDocumentLocalSyncedAt: (docId: string, syncedAt: number) =>
        set((state) => ({
          ...state,
          config: { ...state.config, [docId]: { ...state.config[docId], localSyncedAt: syncedAt } },
        })),

      setDocumentRemoteSyncedAt: (docId: string, syncedAt: number) =>
        set((state) => ({
          ...state,
          config: { ...state.config, [docId]: { ...state.config[docId], remoteSyncedAt: syncedAt } },
        })),

      resetState: (docId: string) =>
        set((state) => ({
          ...state,
          documentStates: {
            ...state.documentStates,
            [docId]: { ...state.documentStates[docId], ...defaultDocumentState },
          },
        })),
    }),
    {
      name: 'document-storage',
      partialize: (state) => ({
        config: state.config,
      }),
    },
  ),
);

export const useDocumentStoreShallow = <T>(selector: (state: DocumentBaseState) => T) => {
  return useDocumentStore(useShallow(selector));
};
