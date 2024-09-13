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

export type ImportResourceMenuItem = 'import-from-weblink' | 'import-from-paste-text';

interface ImportResourceState {
  importResourceModalVisible: boolean;
  selectedMenuItem: ImportResourceMenuItem;

  // scrape
  scrapeLinks: LinkMeta[];
  copiedTextPayload: { content: string; title: string; url?: string };

  // save to collection
  selectedCollectionId: string;

  setImportResourceModalVisible: (visible: boolean) => void;
  setScrapeLinks: (links: LinkMeta[]) => void;
  setCopiedTextPayload: (payload: Partial<{ content: string; title: string; url?: string }>) => void;
  setSelectedCollectionId: (id: string) => void;
  resetState: () => void;
  setSelectedMenuItem: (menuItem: ImportResourceMenuItem) => void;
}

export const defaultState = {
  copiedTextPayload: { content: '', title: '', url: '' },
  scrapeLinks: [],
  selectedCollectionId: '',
  importResourceModalVisible: false,
  selectedMenuItem: 'import-from-weblink' as ImportResourceMenuItem,
};

export const useImportResourceStore = create<ImportResourceState>()(
  devtools((set) => ({
    ...defaultState,

    setImportResourceModalVisible: (visible: boolean) =>
      set((state) => ({ ...state, importResourceModalVisible: visible })),
    setScrapeLinks: (links: LinkMeta[]) => set((state) => ({ ...state, scrapeLinks: links })),
    setCopiedTextPayload: (payload: Partial<{ content: string; title: string; url?: string }>) =>
      set((state) => ({ ...state, copiedTextPayload: { ...state.copiedTextPayload, ...payload } })),
    setSelectedCollectionId: (id: string) => set((state) => ({ ...state, selectedCollectionId: id })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
    setSelectedMenuItem: (menuItem: ImportResourceMenuItem) =>
      set((state) => ({ ...state, selectedMenuItem: menuItem })),
  })),
);
