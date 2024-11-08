import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { Source } from '@refly/openapi-schema';

import { mockSearchSteps, mockResults } from '../mock-data/search-data';

const defaultLocales: SearchLocale[] = [
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: 'Simplified Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh-Hant', name: 'Traditional Chinese' },
  { code: 'fr', name: 'French' },
  { code: 'de-DE', name: 'Standard German' },
  { code: 'ko', name: 'Korean' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'ru', name: 'Russian' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'tr', name: 'Turkish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'id', name: 'Indonesian' },
  { code: 'th', name: 'Thai' },
  { code: 'ar', name: 'Arabic' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'fa', name: 'Persian' },
];

const defaultSelectedLocales = ['en', 'zh-CN', 'ja'];

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
  searchLocales: defaultLocales.filter((locale) => defaultSelectedLocales.includes(locale.code)),
  outputLocale: { code: 'auto', name: 'Auto' },
  isSearching: false,
  searchProgress: 0,
  searchSteps: [],
  results: [],

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
