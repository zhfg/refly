import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface LinkMeta {
  key: string;
  url: string;
  title?: string;
  image?: string;
  description?: string;
  html?: string;
  isHandled?: boolean; // 已经爬取
  isError?: boolean; // 处理失败
}

interface ImportResourceState {
  importResourceModalVisible: boolean;

  // scrape
  scrapeLinks: LinkMeta[];

  setImportResourceModalVisible: (visible: boolean) => void;
  setScapeLinks: (links: LinkMeta[]) => void;
  resetState: () => void;
}

export const defaultState = {
  scrapeLinks: [],
  importResourceModalVisible: false,
};

export const useImportResourceStore = create<ImportResourceState>()(
  devtools((set) => ({
    ...defaultState,

    setImportResourceModalVisible: (visible: boolean) =>
      set((state) => ({ ...state, importResourceModalVisible: visible })),
    setScapeLinks: (links: LinkMeta[]) => set((state) => ({ ...state, scrapeLinks: links })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);
