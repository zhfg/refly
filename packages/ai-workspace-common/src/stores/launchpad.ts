import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

interface LaunchpadState {
  // state
  chatHistoryOpen: boolean;
  recommendQuestionsOpen: boolean;

  // method
  setChatHistoryOpen: (val: boolean) => void;
  setRecommendQuestionsOpen: (val: boolean) => void;
}

export const useLaunchpadStore = create<LaunchpadState>()(
  devtools((set) => ({
    chatHistoryOpen: true,
    recommendQuestionsOpen: false,

    setChatHistoryOpen: (open: boolean) => set({ chatHistoryOpen: open }),
    setRecommendQuestionsOpen: (open: boolean) => set({ recommendQuestionsOpen: open }),
  })),
);

export const useLaunchpadStoreShallow = <T>(selector: (state: LaunchpadState) => T) => {
  return useLaunchpadStore(useShallow(selector));
};
