import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type {} from "@redux-devtools/extension"
import type { Digest, MetaRecord } from "@/types"
// fake data
import { fakeTopics, fakeDigestList } from "@/fake-data/digest"

interface DigestPayload {
  featureList: Digest[]
  pageSize: number
  currentPage: number
  hasMore: boolean
}

export enum DigestType {
  TODAY = "today",
  YESTERDAY = "yesterday",
  LAST_WEEK = "lastWeek",
  LAST_MONTH = "lastMonth",
  LAST_YEAR = "lastYear",
}

interface DigestState {
  today: DigestPayload // TODO：获取 37 个，暂时不清楚寓意，不过先开发
  yesterday: DigestPayload // 只获取一页
  lastWeek: DigestPayload // 只获取一页
  lastMonth: DigestPayload // 只获取一页
  lastYear: DigestPayload // 只获取一页
  topic: {
    data: MetaRecord[]
    count: number // 需要做响应式的处理
  } // 所有的主题

  updatePayload: (newPayload: DigestPayload, type: DigestType) => void
  updateTopics: (newTopics: MetaRecord[]) => void
  resetState: () => void
}

const defaultDigestPayload = {
  featureList: [] as Digest[],
  pageSize: 10,
  currentPage: 1,
  hasMore: true,
}

export const defaultState = {
  today: {
    ...defaultDigestPayload,
    featureList: fakeDigestList || [],
  },
  yesterday: defaultDigestPayload,
  lastWeek: defaultDigestPayload,
  lastMonth: defaultDigestPayload,
  lastYear: defaultDigestPayload,
  topic: {
    data: fakeTopics || [],
    count: 0,
  },
}

export const useDigestStore = create<DigestState>()(
  devtools(set => ({
    ...defaultState,

    updatePayload: (newPayload: DigestPayload, type: DigestType) =>
      set(state => {
        return {
          ...state,
          [type]: { ...state?.[type], ...newPayload },
        }
      }),
    updateTopics: (newTopics: MetaRecord[]) =>
      set(state => {
        return { ...state, topics: newTopics }
      }),
    resetState: () => set(state => ({ ...state, ...defaultState })),
  })),
)
