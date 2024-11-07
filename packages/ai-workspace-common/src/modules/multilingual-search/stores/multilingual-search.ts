import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { SearchState, SearchLocale, SearchStep } from '../types';

const defaultLocales: SearchLocale[] = [
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: 'Simplified Chinese' },
  { code: 'ja', name: 'Japanese' },
];

export const useMultilingualSearchStore = create<SearchState>((set) => ({
  query: '',
  searchLocales: defaultLocales,
  outputLocale: defaultLocales[0],
  isSearching: false,
  searchProgress: 0,
  searchSteps: [],
  results: [],

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
