import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

interface LaunchpadState {
  // state
  chatHistoryOpen: boolean;

  // method
  setChatHistoryOpen: (val: boolean) => void;
}

export const useLaunchpadStore = create<LaunchpadState>()(
  devtools((set) => ({
    chatHistoryOpen: false,

    setChatHistoryOpen: (open: boolean) => set({ chatHistoryOpen: open }),
  })),
);

export const useLaunchpadStoreShallow = <T>(selector: (state: LaunchpadState) => T) => {
  return useLaunchpadStore(useShallow(selector));
};
