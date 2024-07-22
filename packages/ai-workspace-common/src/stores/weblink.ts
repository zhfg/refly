import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { Weblink } from '@refly/openapi-schema';

export interface Thread {
  id: string;
  convId: string;
  userId: string;
  title: string;
  lastMessage: string;
  messageCount: number;
  origin: string;
  originPageUrl: string;
  originPageTitle: string;
  createdAt: string;
  updatedAt: string;
}

interface WeblinkState {
  isWebLinkListVisible: boolean;
  webLinkList: Weblink[];
  pageSize: number;
  selectedRow: { key: number | string; content: Weblink }[];
  currentPage: number;
  hasMore: boolean;
  isRequest: boolean;

  updateWebLinkList: (newWebLinkList: Weblink[]) => void;
  updateCurrentPage: (currentPage: number) => void;
  updateHasMore: (hasMore: boolean) => void;
  updateIsRequest: (isRequest: boolean) => void;
  updateIsWebLinkListVisible: (isWebLinkListVisible: boolean) => void;
  updateSelectedRow: (selectedRow: { key: number | string; content: Weblink }[]) => void;
  resetState: () => void;
}

export const defaultState = {
  isWebLinkListVisible: false,
  webLinkList: [] as Weblink[],
  selectedRow: [],
  pageSize: 10,
  currentPage: 1,
  hasMore: true,
  isRequest: false,
};

export const useWeblinkStore = create<WeblinkState>()(
  devtools((set) => ({
    ...defaultState,

    updateWebLinkList: (newWebLinkList: Weblink[]) =>
      set((state) => ({
        ...state,
        webLinkList: state.webLinkList.concat(newWebLinkList),
      })),
    updateCurrentPage: (currentPage: number) => set((state) => ({ ...state, currentPage })),
    updateHasMore: (hasMore: boolean) => set((state) => ({ ...state, hasMore })),
    updateIsRequest: (isRequest: boolean) => set((state) => ({ ...state, isRequest })),
    updateIsWebLinkListVisible: (isWebLinkListVisible: boolean) => set((state) => ({ ...state, isWebLinkListVisible })),
    updateSelectedRow: (selectedRow: { key: number | string; content: Weblink }[]) =>
      set((state) => ({ ...state, selectedRow })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);
