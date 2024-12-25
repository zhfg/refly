import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { immer } from 'zustand/middleware/immer';
import { Document } from '@refly/openapi-schema';

export enum ActionSource {
  KnowledgeBase = 'knowledge-base',
  Conv = 'conv',
  Canvas = 'canvas',
}

export interface TableOfContentsItem {
  isActive: boolean;
  isScrolledOver: boolean;
  id: string;
  itemIndex: number;
  textContent: string;
}

interface DocumentState {
  documentCharsCount?: number;
  lastCursorPosRef?: number;
  tocItems?: TableOfContentsItem[];
  currentDocument?: Document;
}

interface DocumentConfig {
  readOnly?: boolean;
  localSyncedAt?: number;
  remoteSyncedAt?: number;
}

interface DocumentBaseState {
  // Canvas specific states stored by docId
  activeDocumentId: string;
  hasEditorSelection: boolean;
  documentStates: Record<string, DocumentState>;
  config: Record<string, DocumentConfig>;

  setHasEditorSelection: (hasEditorSelection: boolean) => void;
  updateCurrentDocument: (docId: string, document: Document) => void;
  updateDocumentCharsCount: (docId: string, count: number) => void;
  updateLastCursorPosRef: (docId: string, pos: number) => void;
  updateTocItems: (docId: string, items: TableOfContentsItem[]) => void;
  setActiveDocumentId: (docId: string) => void;

  setDocumentReadOnly: (docId: string, readOnly: boolean) => void;
  setDocumentLocalSyncedAt: (docId: string, syncedAt: number) => void;
  setDocumentRemoteSyncedAt: (docId: string, syncedAt: number) => void;

  deleteDocumentData: (docId: string) => void;

  resetState: (docId: string) => void;
}

export const defaultState = {
  hasEditorSelection: false,
  documentStates: {},
  activeDocumentId: '',
  config: {},
};

export const useDocumentStore = create<DocumentBaseState>()(
  persist(
    immer((set) => ({
      ...defaultState,

      setHasEditorSelection: (hasEditorSelection: boolean) =>
        set((state) => {
          state.hasEditorSelection = hasEditorSelection;
        }),

      updateCurrentDocument: (docId: string, document: Document) =>
        set((state) => {
          state.documentStates[docId] ??= {};
          state.documentStates[docId].currentDocument = document;
        }),

      updateDocumentCharsCount: (docId: string, count: number) =>
        set((state) => {
          state.documentStates[docId] ??= {};
          state.documentStates[docId].documentCharsCount = count;
        }),

      updateLastCursorPosRef: (docId: string, pos: number) =>
        set((state) => {
          state.documentStates[docId] ??= {};
          state.documentStates[docId].lastCursorPosRef = pos;
        }),

      updateTocItems: (docId: string, items: TableOfContentsItem[]) =>
        set((state) => {
          state.documentStates[docId] ??= {};
          state.documentStates[docId].tocItems = items;
        }),

      setActiveDocumentId: (docId: string) =>
        set((state) => {
          state.activeDocumentId = docId;
        }),

      setDocumentReadOnly: (docId: string, readOnly: boolean) =>
        set((state) => {
          state.config[docId] ??= {};
          state.config[docId].readOnly = readOnly;
        }),

      setDocumentLocalSyncedAt: (docId: string, syncedAt: number) =>
        set((state) => {
          state.config[docId] ??= {};
          state.config[docId].localSyncedAt = syncedAt;
        }),

      setDocumentRemoteSyncedAt: (docId: string, syncedAt: number) =>
        set((state) => {
          state.config[docId] ??= {};
          state.config[docId].remoteSyncedAt = syncedAt;
        }),

      deleteDocumentData: (docId: string) =>
        set((state) => {
          delete state.config[docId];
          delete state.documentStates[docId];
        }),

      resetState: (docId: string) =>
        set((state) => {
          state.documentStates[docId] = {};
        }),
    })),
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
