import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type {} from "@redux-devtools/extension"

import type { MetaRecord as Topic } from "@/types"

interface TopicState {
  topicList: Topic[]
  pageSize: number
  currentPage: number
  hasMore: boolean

  updateTopicList: (newTopicList: Topic[]) => void
  updateCurrentPage: (currentPage: number) => void
  updateHasMore: (hasMore: boolean) => void
  resetState: () => void
}

export const defaultState = {
  topicList: [] as Topic[],
  pageSize: 10,
  currentPage: 1,
  hasMore: true,
}

export const useDigestTopicStore = create<TopicState>()(
  devtools(set => ({
    ...defaultState,

    updateTopicList: (newTopicList: Topic[]) =>
      set(state => ({
        ...state,
        topics: state.topicList.concat(newTopicList),
      })),
    updateCurrentPage: (currentPage: number) =>
      set(state => ({ ...state, currentPage })),
    updateHasMore: (hasMore: boolean) => set(state => ({ ...state, hasMore })),
    resetState: () => set(state => ({ ...state, ...defaultState })),
  })),
)
