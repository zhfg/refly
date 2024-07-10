import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension';

export interface SearchState {
  // state
  isSearchOpen: boolean;

  // method
  setIsSearchOpen: (isSearchOpen: boolean) => void;
  resetState: () => void;
}

export const defaultState = {
  isSearchOpen: false,
};

export const useSearchStore = create<SearchState>()(
  devtools((set) => ({
    ...defaultState,

    setIsSearchOpen: (isSearchOpen: boolean) => set((state) => ({ ...state, isSearchOpen })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);
