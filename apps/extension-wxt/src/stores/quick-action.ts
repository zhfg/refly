import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension';
import type { Mode } from '@/types';
import { modeList } from '@/utils/quick-action';

interface BarPosition {
  top?: number;
  left?: number;
}

interface QuickActionState {
  // state
  selectedText: string;
  toolbarVisible: boolean;
  barDimension: {
    width: number;
    height: number;
  };
  barPosition: BarPosition;
  currentMode: Mode;
  defaultMode: Mode;

  // method
  setSelectedText: (val: string) => void;
  setToolbarVisible: (val: boolean) => void;
  setBarPosition: (val: BarPosition) => void;
  setCurrentMode: (val: Mode) => void;
  setDefaultMode: (val: Mode) => void;
  resetState: () => void;
}

const defaultState = {
  selectedText: '',
  toolbarVisible: false,
  currentMode: modeList[0],
  defaultMode: modeList[0],
};

export const useQuickActionStore = create<QuickActionState>()(
  devtools((set) => ({
    ...defaultState,
    barDimension: {
      width: 145,
      height: 33,
    },
    barPosition: {
      top: null,
      left: null,
    },

    setSelectedText: (val: string) => set({ selectedText: val }),
    setToolbarVisible: (val: boolean) => set({ toolbarVisible: val }),
    setBarPosition: (val: BarPosition) => set({ barPosition: val }),
    setCurrentMode: (val: Mode) => set({ currentMode: val }),
    setDefaultMode: (val: Mode) => set({ defaultMode: val }),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);
