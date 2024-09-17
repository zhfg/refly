import { create } from 'zustand';

import { CustomPromptList } from '../utils/quick-action';
import { CustomPrompt } from '../types/custom-prompt';

type State = {
  selectedText: string;
  popupVisible: boolean;
  quickActionToolbarVisible: boolean;
  isShowSide: boolean;
  currentCustomPrompt: CustomPrompt;
  translateLanguage: string;
};

type Action = {
  updateUIState: (state: Partial<State>) => void;
  resetUIState: () => void;
};

const defaultState: State = {
  selectedText: '',
  popupVisible: false,
  quickActionToolbarVisible: false,
  currentCustomPrompt: CustomPromptList[0],
  translateLanguage: '',
  isShowSide: false,
};

export const useQuickActionStore = create<State & Action>((set, get) => ({
  ...defaultState,
  updateUIState: (incomingState) =>
    set((state) => {
      return {
        ...state,
        ...incomingState,
      };
    }),
  resetUIState: () => set(() => ({ ...defaultState })),
}));
