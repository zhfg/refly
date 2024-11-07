import { Source } from '@refly/openapi-schema';

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
