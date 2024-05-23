import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type {} from "@redux-devtools/extension"
import type {
  CollectionListItem,
  CollectionDetail,
  ResourceDetail,
} from "@/types/knowledge-base"

export enum ActionSource {
  KnowledgeBase = "knowledge-base",
  Conv = "conv",
  Note = "note",
}

interface KnowledgeBaseState {
  isSaveKnowledgeBaseModalVisible: boolean
  knowledgeBaseList: CollectionListItem[]
  pageSize: number
  currentPage: number
  hasMore: boolean
  isRequesting: boolean

  // 详情
  currentKnowledgeBase: null | CollectionDetail
  currentResource: null | ResourceDetail

  // 会话 modal
  convModalVisible: boolean
  kbModalVisible: boolean
  actionSource: ActionSource

  updateIsSaveKnowledgeBaseModalVisible: (
    isSaveKnowledgeBaseModalVisible: boolean,
  ) => void
  updateIsRequesting: (isRequesting: boolean) => void
  updateKnowledgeBaseList: (knowledgeBaseList: CollectionListItem[]) => void
  updateCurrentKnowledgeBase: (knowledgeBase: CollectionDetail) => void
  updateResource: (resource: ResourceDetail) => void
  updateCurrentPage: (currentPage: number) => void
  updateHasMore: (hasMore: boolean) => void
  updateConvModalVisible: (convModalVisible: boolean) => void
  updateActionSource: (actionSource: ActionSource) => void
  updateKbModalVisible: (kbModalVisible: boolean) => void
  resetState: () => void
}

export const defaultState = {
  isSaveKnowledgeBaseModalVisible: false,
  convModalVisible: false,
  kbModalVisible: false,
  actionSource: ActionSource.Conv,
  currentKnowledgeBase: null,
  currentResource: null,
  knowledgeBaseList: [],
  pageSize: 10,
  currentPage: 1,
  hasMore: true,
  isRequesting: false,
}

export const useKnowledgeBaseStore = create<KnowledgeBaseState>()(
  devtools(set => ({
    ...defaultState,

    updateIsSaveKnowledgeBaseModalVisible: (
      isSaveKnowledgeBaseModalVisible: boolean,
    ) => set(state => ({ ...state, isSaveKnowledgeBaseModalVisible })),
    updateKnowledgeBaseList: (knowledgeBaseList: CollectionListItem[]) =>
      set(state => ({
        ...state,
        knowledgeBaseList,
      })),
    updateCurrentKnowledgeBase: (knowledgeBase: CollectionDetail) =>
      set(state => ({
        ...state,
        currentKnowledgeBase: knowledgeBase,
      })),
    updateResource: (resource: ResourceDetail) =>
      set(state => ({
        ...state,
        currentResource: resource,
      })),
    updateCurrentPage: (currentPage: number) =>
      set(state => ({ ...state, currentPage })),
    updateHasMore: (hasMore: boolean) => set(state => ({ ...state, hasMore })),
    updateConvModalVisible: (convModalVisible: boolean) =>
      set(state => ({ ...state, convModalVisible })),
    updateKbModalVisible: (kbModalVisible: boolean) =>
      set(state => ({ ...state, kbModalVisible })),
    updateIsRequesting: (isRequesting: boolean) =>
      set(state => ({ ...state, isRequesting })),
    updateActionSource: (actionSource: ActionSource) =>
      set(state => ({ ...state, actionSource })),
    resetState: () => set(state => ({ ...state, ...defaultState })),
  })),
)
