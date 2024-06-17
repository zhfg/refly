import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension';
import type { CollectionListItem, CollectionDetail, ResourceDetail } from '@refly/openapi-schema';

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

export interface SkillState {
  [skillName: string]: any;
}

export type SelectedNamespace = 'resource-detail' | 'note';
export type NoteServerStatus = 'disconnected' | 'connected';
export type NoteSaveStatus = 'Saved' | 'Unsaved';

interface KnowledgeBaseState {
  isSaveKnowledgeBaseModalVisible: boolean;
  knowledgeBaseList: CollectionListItem[];
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
  noteServerStatus: NoteServerStatus;
  noteCharsCount: number;
  noteSaveStatus: NoteSaveStatus;

  // 详情
  currentKnowledgeBase: null | CollectionDetail;
  currentResource: null | ResourceDetail;

  // 会话 modal
  convModalVisible: boolean;
  kbModalVisible: boolean;
  actionSource: ActionSource;

  // source-list
  sourceListModalVisible: boolean;
  tempConvResources: ResourceDetail[];

  // skills states
  skillState: SkillState;
  setSkillState: (newState: SkillState) => void;

  updateIsSaveKnowledgeBaseModalVisible: (isSaveKnowledgeBaseModalVisible: boolean) => void;
  updateIsRequesting: (isRequesting: boolean) => void;
  updateKnowledgeBaseList: (knowledgeBaseList: CollectionListItem[]) => void;
  updateCurrentKnowledgeBase: (knowledgeBase: CollectionDetail) => void;
  updateResource: (resource: ResourceDetail) => void;
  updateCurrentPage: (currentPage: number) => void;
  updateHasMore: (hasMore: boolean) => void;
  updateConvModalVisible: (convModalVisible: boolean) => void;
  updateActionSource: (actionSource: ActionSource) => void;
  updateKbModalVisible: (kbModalVisible: boolean) => void;
  updateSourceListModalVisible: (sourceListModalVisible: boolean) => void;
  updateTempConvResources: (tempConvResources: ResourceDetail[]) => void;
  updateSelectedText: (selectedText: string) => void;
  updateSelectedNamespace: (selectedNamespace: SelectedNamespace) => void;
  updateTabs: (tabs: KnowledgeBaseTab[]) => void;
  updateActiveTab: (key: string) => void;
  updateResourcePanelVisible: (visible: boolean) => void;
  updateNotePanelVisible: (visible: boolean) => void;
  updateNoteServerStatus: (status: NoteServerStatus) => void;
  updateNoteSaveStatus: (status: NoteSaveStatus) => void;
  updateNoteCharsCount: (count: number) => void;
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
  notePanelVisible: false,

  // notes
  noteServerStatus: 'disconnected' as NoteServerStatus,
  noteCharsCount: 0,
  noteSaveStatus: 'Unsaved' as NoteSaveStatus,

  convModalVisible: false,
  kbModalVisible: false,
  sourceListModalVisible: false,
  tempConvResources: [] as ResourceDetail[],
  actionSource: ActionSource.Conv,
  currentKnowledgeBase: null,
  currentResource: null,
  knowledgeBaseList: [],
  pageSize: 10,
  currentPage: 1,
  hasMore: true,
  isRequesting: false,

  // skills
  skillState: {},
};

export const useKnowledgeBaseStore = create<KnowledgeBaseState>()(
  devtools((set) => ({
    ...defaultState,

    updateIsSaveKnowledgeBaseModalVisible: (isSaveKnowledgeBaseModalVisible: boolean) =>
      set((state) => ({ ...state, isSaveKnowledgeBaseModalVisible })),
    updateKnowledgeBaseList: (knowledgeBaseList: CollectionListItem[]) =>
      set((state) => ({
        ...state,
        knowledgeBaseList,
      })),
    updateCurrentKnowledgeBase: (knowledgeBase: CollectionDetail) =>
      set((state) => ({
        ...state,
        currentKnowledgeBase: knowledgeBase,
      })),
    updateResource: (resource: ResourceDetail) =>
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
    updateTempConvResources: (tempConvResources: ResourceDetail[]) => set((state) => ({ ...state, tempConvResources })),
    updateSelectedText: (selectedText: string) => set((state) => ({ ...state, currentSelectedText: selectedText })),
    updateSelectedNamespace: (selectedNamespace: SelectedNamespace) =>
      set((state) => ({ ...state, selectedNamespace })),
    updateTabs: (tabs: KnowledgeBaseTab[]) => set((state) => ({ ...state, tabs })),
    updateActiveTab: (key: string) => set((state) => ({ ...state, activeTab: key })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),

    // skill
    setSkillState: (newState: SkillState) => set((state) => ({ ...state, skillState: newState })),

    // tabs
    updateResourcePanelVisible: (visible: boolean) => set((state) => ({ ...state, resourcePanelVisible: visible })),
    updateNotePanelVisible: (visible: boolean) => set((state) => ({ ...state, notePanelVisible: visible })),

    // notes
    updateNoteServerStatus: (status: NoteServerStatus) => set((state) => ({ ...state, noteServerStatus: status })),
    updateNoteSaveStatus: (status: NoteSaveStatus) => set((state) => ({ ...state, noteSaveStatus: status })),
    updateNoteCharsCount: (count: number) => set((state) => ({ ...state, noteCharsCount: count })),
  })),
);
