import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { Digest, ContentMetaRecord as Topic } from '@refly/openapi-schema';

/**
 * 承载着 topic detail 以及此 topic 下所有的 digest list
 */
interface DigestTopicDetailState {
  digestList: Digest[];
  digestTopicDetail: Topic | null;
  pageSize: number;
  currentPage: number;
  hasMore: boolean;

  updateDigestTopicDetail: (newDigestTopicDetail: Topic) => void;
  updateTopicDigestList: (newTopicDigestList: Digest[]) => void;
  updateCurrentPage: (currentPage: number) => void;
  updateHasMore: (hasMore: boolean) => void;
  resetState: () => void;
}

export const defaultState = {
  digestList: [] as Digest[],
  digestTopicDetail: null,
  pageSize: 10,
  currentPage: 1,
  hasMore: true,
};

export const useDigestTopicDetailStore = create<DigestTopicDetailState>()(
  devtools((set) => ({
    ...defaultState,

    updateTopicDigestList: (newTopicDigestList: Digest[]) =>
      set((state) => ({
        ...state,
        digestList: state.digestList.concat(newTopicDigestList),
      })),
    updateDigestTopicDetail: (newDigestTopicDetail: Topic) =>
      set((state) => ({
        state,
        digestTopicDetail: {
          ...state.digestTopicDetail,
          ...newDigestTopicDetail,
        },
      })),
    updateCurrentPage: (currentPage: number) => set((state) => ({ ...state, currentPage })),
    updateHasMore: (hasMore: boolean) => set((state) => ({ ...state, hasMore })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);
