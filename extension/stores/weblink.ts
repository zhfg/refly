import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type {} from "@redux-devtools/extension"
import type { WebLinkItem } from "~components/weblink-list/types"

export interface Thread {
  id: string
  conversationId: string
  userId: string
  title: string
  lastMessage: string
  messageCount: number
  origin: string
  originPageUrl: string
  originPageTitle: string
  createdAt: string
  updatedAt: string
}

interface WeblinkState {
  isWebLinkListVisible: boolean
  webLinkList: WebLinkItem[]
  pageSize: number
  selectedRow: { key: number | string; content: WebLinkItem }[]
  currentPage: number
  hasMore: boolean
  isRequest: boolean

  updateWebLinkList: (newWebLinkList: WebLinkItem[]) => void
  updateCurrentPage: (currentPage: number) => void
  updateHasMore: (hasMore: boolean) => void
  updateIsRequest: (isRequest: boolean) => void
  updateIsWebLinkListVisible: (isWebLinkListVisible: boolean) => void
  updateSelectedRow: (
    selectedRow: { key: number | string; content: WebLinkItem }[],
  ) => void
  resetState: () => void
}

export const defaultState = {
  isWebLinkListVisible: false,
  webLinkList: [] as WebLinkItem[],
  selectedRow: [],
  pageSize: 10,
  currentPage: 1,
  hasMore: true,
  isRequest: false,
}

export const useWeblinkStore = create<WeblinkState>()(
  devtools((set) => ({
    ...defaultState,

    updateWebLinkList: (newWebLinkList: WebLinkItem[]) =>
      set((state) => ({
        ...state,
        webLinkList: state.webLinkList.concat(newWebLinkList),
      })),
    updateCurrentPage: (currentPage: number) =>
      set((state) => ({ ...state, currentPage })),
    updateHasMore: (hasMore: boolean) =>
      set((state) => ({ ...state, hasMore })),
    updateIsRequest: (isRequest: boolean) =>
      set((state) => ({ ...state, isRequest })),
    updateIsWebLinkListVisible: (isWebLinkListVisible: boolean) =>
      set((state) => ({ ...state, isWebLinkListVisible })),
    updateSelectedRow: (
      selectedRow: { key: number | string; content: WebLinkItem }[],
    ) => set((state) => ({ ...state, selectedRow })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
)
