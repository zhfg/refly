import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type {} from "@redux-devtools/extension"

import type { Digest } from "@/types"

// digest archive 和其他 digest 类似在早期
interface DigestArchiveState {
  digestList: Digest[]
  pageSize: number
  currentPage: number
  hasMore: boolean

  updateDigestList: (newDigestList: Digest[]) => void
  updateCurrentPage: (currentPage: number) => void
  updateHasMore: (hasMore: boolean) => void
  resetState: () => void
}

export const defaultState = {
  digestList: [] as Digest[],
  pageSize: 10,
  currentPage: 1,
  hasMore: true,
}

export const useDigestArchiveStore = create<DigestArchiveState>()(
  devtools(set => ({
    ...defaultState,

    updateDigestList: (newTopicDigestList: Digest[]) =>
      set(state => ({
        ...state,
        digestList: state.digestList.concat(newTopicDigestList),
      })),
    updateCurrentPage: (currentPage: number) =>
      set(state => ({ ...state, currentPage })),
    updateHasMore: (hasMore: boolean) => set(state => ({ ...state, hasMore })),
    resetState: () => set(state => ({ ...state, ...defaultState })),
  })),
)
