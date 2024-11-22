import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

interface SiderState {
  // state
  collapse: boolean;
  showSiderDrawer: boolean;

  // method
  setCollapse: (val: boolean) => void;
  setShowSiderDrawer: (val: boolean) => void;
}

export const useSiderStore = create<SiderState>()(
  devtools((set) => ({
    collapse: false,
    showSiderDrawer: false,

    setCollapse: (val: boolean) => set({ collapse: val }),
    setShowSiderDrawer: (val: boolean) => set({ showSiderDrawer: val }),
  })),
);

export const useSiderStoreShallow = <T>(selector: (state: SiderState) => T) => {
  return useSiderStore(useShallow(selector));
};
