import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension';

interface HandleTopSkills {
  // state
  shouldUpdate: boolean;

  // method
  setShouldUpdate: (val: boolean) => void;
}

export const useHandleTopSkills = create<HandleTopSkills>()(
  devtools((set) => ({
    shouldUpdate: false,

    setShouldUpdate: (val: boolean) => set({ shouldUpdate: val }),
  })),
);
