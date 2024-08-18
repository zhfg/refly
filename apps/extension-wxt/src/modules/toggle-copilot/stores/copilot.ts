import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension';

interface CopilotState {
  // state
  isCopilotOpen: boolean;

  // method
  setIsCopilotOpen: (val: boolean) => void;
}

export const useCopilotStore = create<CopilotState>()(
  devtools((set) => ({
    isCopilotOpen: false,

    setIsCopilotOpen: (val: boolean) => set({ isCopilotOpen: val }),
  })),
);
