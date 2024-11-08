import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { Source } from '@refly/openapi-schema';

import { mockSearchSteps, mockResults } from '../mock-data/search-data';

const defaultLocales: SearchLocale[] = [
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: 'Simplified Chinese' },
  { code: 'ja', name: 'Japanese' },
];

export interface SearchLocale {
  code: string;
  name: string;
}

export interface SearchState {
  query: string;
  searchLocales: SearchLocale[];
  outputLocale: SearchLocale;
  isSearching: boolean;
  searchProgress: number;
  searchSteps: SearchStep[];
  results: Source[];

  selectedItems: Source[];
  setSelectedItems: (items: Source[]) => void;
  toggleSelectedItem: (item: Source, checked: boolean) => void;
  clearSelectedItems: () => void;

  setQuery: (query: string) => void;
  setIsSearching: (isSearching: boolean) => void;
  setSearchLocales: (locales: SearchLocale[]) => void;
  setOutputLocale: (locale: SearchLocale) => void;
  updateProgress: (progress: number) => void;
  addSearchStep: (step: SearchStep) => void;
  setProcessingStep: () => void;
  setResults: (results: Source[]) => void;
  resetSearch: () => void;
}

export interface SearchStep {
  step: string;
  duration: number;
  result?: any;
}

export const useMultilingualSearchStore = create<SearchState>((set) => ({
  query: '',
  searchLocales: defaultLocales,
  outputLocale: defaultLocales[0],
  isSearching: false,
  searchProgress: 0,
  searchSteps: mockSearchSteps,
  results: mockResults,

  selectedItems: [],
  setSelectedItems: (items) => set({ selectedItems: items }),
  toggleSelectedItem: (item, checked) =>
    set((state) => ({
      selectedItems: checked ? [...state.selectedItems, item] : state.selectedItems.filter((i) => i !== item),
    })),
  clearSelectedItems: () => set({ selectedItems: [] }),

  setQuery: (query) => set({ query }),
  setSearchLocales: (locales) => set({ searchLocales: locales }),
  setOutputLocale: (locale) => set({ outputLocale: locale }),
  setIsSearching: (isSearching) => set({ isSearching }),

  updateProgress: (progress) => set({ searchProgress: progress }),
  addSearchStep: (step) =>
    set((state) => ({
      searchSteps: [...state.searchSteps.filter((s) => s.step !== 'Processing...'), step],
    })),
  setProcessingStep: () =>
    set((state) => ({
      searchSteps: [...state.searchSteps, { step: 'Processing...', duration: 0 }],
    })),
  setResults: (results) =>
    set({
      results,
      isSearching: false,
      searchProgress: 100,
    }),
  resetSearch: () =>
    set({
      query: '',
      isSearching: false,
      searchProgress: 0,
      searchSteps: [],
      results: [],
    }),
}));

export const useMultilingualSearchStoreShallow = <T>(selector: (state: SearchState) => T) => {
  return useMultilingualSearchStore(useShallow(selector));
};
