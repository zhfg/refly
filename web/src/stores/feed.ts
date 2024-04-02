import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type {} from "@redux-devtools/extension"

import type { Feed } from "@/types"

interface FeedState {
  feeds: Feed[]
  pageSize: number
  currentPage: number
  hasMore: boolean

  updateFeedList: (newFeedList: Feed[]) => void
  updateCurrentPage: (currentPage: number) => void
  updateHasMore: (hasMore: boolean) => void
  resetState: () => void
}

export const defaultState = {
  feeds: [] as Feed[],
  pageSize: 10,
  currentPage: 1,
  hasMore: true,
}

export const useFeedStore = create<FeedState>()(
  devtools(set => ({
    ...defaultState,

    updateFeedList: (newFeedList: Feed[]) =>
      set(state => ({
        ...state,
        feeds: state.feeds.concat(newFeedList),
      })),
    updateCurrentPage: (currentPage: number) =>
      set(state => ({ ...state, currentPage })),
    updateHasMore: (hasMore: boolean) => set(state => ({ ...state, hasMore })),
    resetState: () => set(state => ({ ...state, ...defaultState })),
  })),
)
