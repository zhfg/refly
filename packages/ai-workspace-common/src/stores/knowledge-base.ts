import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension';
import type { Collection, Resource } from '@refly/openapi-schema';
import { EditorInstance } from '@refly-packages/editor-core/components';

export enum ActionSource {
  KnowledgeBase = 'knowledge-base',
  Conv = 'conv',
  Note = 'note',
}

export interface KnowledgeBaseTab {
  title: string;
  key: string;
  content: string;
  collectionId: string;
  resourceId: string;
}

export type SelectedNamespace = 'resource-detail' | 'note';
export type NoteServerStatus = 'disconnected' | 'connected';
export type NoteSaveStatus = 'Saved' | 'Unsaved';

interface KnowledgeBaseState {
  isSaveKnowledgeBaseModalVisible: boolean;
  knowledgeBaseList: Collection[];
  pageSize: number;
  currentPage: number;
  hasMore: boolean;
  isRequesting: boolean;

  // selection
  currentSelectedText: string;
  selectedNamespace: SelectedNamespace;

  // tabs
  tabs: KnowledgeBaseTab[];
  activeTab: string;
  resourcePanelVisible: boolean;
  notePanelVisible: boolean;

  // 笔记
  editor: EditorInstance | null;
  noteServerStatus: NoteServerStatus;
  noteCharsCount: number;
  noteSaveStatus: NoteSaveStatus;

  // 详情
  currentKnowledgeBase: null | Collection;
  currentResource: null | Resource;

  // 会话 modal
  convModalVisible: boolean;
  kbModalVisible: boolean;
  actionSource: ActionSource;

  // source-list
  sourceListModalVisible: boolean;
  tempConvResources: Resource[];

  updateIsSaveKnowledgeBaseModalVisible: (isSaveKnowledgeBaseModalVisible: boolean) => void;
  updateIsRequesting: (isRequesting: boolean) => void;
  updateKnowledgeBaseList: (knowledgeBaseList: Collection[]) => void;
  updateCurrentKnowledgeBase: (knowledgeBase: Collection) => void;
  updateResource: (resource: Resource) => void;
  updateCurrentPage: (currentPage: number) => void;
  updateHasMore: (hasMore: boolean) => void;
  updateConvModalVisible: (convModalVisible: boolean) => void;
  updateActionSource: (actionSource: ActionSource) => void;
  updateKbModalVisible: (kbModalVisible: boolean) => void;
  updateSourceListModalVisible: (sourceListModalVisible: boolean) => void;
  updateTempConvResources: (tempConvResources: Resource[]) => void;
  updateSelectedText: (selectedText: string) => void;
  updateSelectedNamespace: (selectedNamespace: SelectedNamespace) => void;
  updateTabs: (tabs: KnowledgeBaseTab[]) => void;
  updateActiveTab: (key: string) => void;
  updateResourcePanelVisible: (visible: boolean) => void;
  updateNotePanelVisible: (visible: boolean) => void;
  updateNoteServerStatus: (status: NoteServerStatus) => void;
  updateNoteSaveStatus: (status: NoteSaveStatus) => void;
  updateNoteCharsCount: (count: number) => void;
  updateEditor: (editor: EditorInstance) => void;
  resetState: () => void;
}

export const defaultState = {
  isSaveKnowledgeBaseModalVisible: false,
  currentSelectedText: '',
  selectedNamespace: 'resource-detail' as SelectedNamespace,
  tabs: [
    {
      title: 'New Tab',
      key: 'key1',
      content: 'Content of Tab Pane 1',
    },
  ] as KnowledgeBaseTab[],
  activeTab: 'key1',
  resourcePanelVisible: true,
  notePanelVisible: true,

  // notes
  editor: null,
  noteServerStatus: 'disconnected' as NoteServerStatus,
  noteCharsCount: 0,
  noteSaveStatus: 'Unsaved' as NoteSaveStatus,

  convModalVisible: false,
  kbModalVisible: false,
  sourceListModalVisible: false,
  tempConvResources: [] as Resource[],
  actionSource: ActionSource.Conv,
  currentKnowledgeBase: null,
  currentResource: null,
  knowledgeBaseList: [],
  pageSize: 10,
  currentPage: 1,
  hasMore: true,
  isRequesting: false,
};

export const useKnowledgeBaseStore = create<KnowledgeBaseState>()(
  devtools((set) => ({
    ...defaultState,

    updateIsSaveKnowledgeBaseModalVisible: (isSaveKnowledgeBaseModalVisible: boolean) =>
      set((state) => ({ ...state, isSaveKnowledgeBaseModalVisible })),
    updateKnowledgeBaseList: (knowledgeBaseList: Collection[]) =>
      set((state) => ({
        ...state,
        knowledgeBaseList,
      })),
    updateCurrentKnowledgeBase: (knowledgeBase: Collection) =>
      set((state) => ({
        ...state,
        currentKnowledgeBase: knowledgeBase,
      })),
    updateResource: (resource: Resource) =>
      set((state) => ({
        ...state,
        currentResource: resource,
      })),
    updateCurrentPage: (currentPage: number) => set((state) => ({ ...state, currentPage })),
    updateHasMore: (hasMore: boolean) => set((state) => ({ ...state, hasMore })),
    updateConvModalVisible: (convModalVisible: boolean) => set((state) => ({ ...state, convModalVisible })),
    updateKbModalVisible: (kbModalVisible: boolean) => set((state) => ({ ...state, kbModalVisible })),
    updateSourceListModalVisible: (sourceListModalVisible: boolean) =>
      set((state) => ({ ...state, sourceListModalVisible })),
    updateIsRequesting: (isRequesting: boolean) => set((state) => ({ ...state, isRequesting })),
    updateActionSource: (actionSource: ActionSource) => set((state) => ({ ...state, actionSource })),
    updateTempConvResources: (tempConvResources: Resource[]) => set((state) => ({ ...state, tempConvResources })),
    updateSelectedText: (selectedText: string) => set((state) => ({ ...state, currentSelectedText: selectedText })),
    updateSelectedNamespace: (selectedNamespace: SelectedNamespace) =>
      set((state) => ({ ...state, selectedNamespace })),
    updateTabs: (tabs: KnowledgeBaseTab[]) => set((state) => ({ ...state, tabs })),
    updateActiveTab: (key: string) => set((state) => ({ ...state, activeTab: key })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),

    // tabs
    updateResourcePanelVisible: (visible: boolean) => set((state) => ({ ...state, resourcePanelVisible: visible })),
    updateNotePanelVisible: (visible: boolean) => set((state) => ({ ...state, notePanelVisible: visible })),

    // notes
    updateEditor: (editor: EditorInstance) => set((state) => ({ ...state, editor })),
    updateNoteServerStatus: (status: NoteServerStatus) => set((state) => ({ ...state, noteServerStatus: status })),
    updateNoteSaveStatus: (status: NoteSaveStatus) => set((state) => ({ ...state, noteSaveStatus: status })),
    updateNoteCharsCount: (count: number) => set((state) => ({ ...state, noteCharsCount: count })),
  })),
);
