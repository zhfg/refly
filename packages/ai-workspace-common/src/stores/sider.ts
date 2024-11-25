import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

interface SiderData {
  id: string;
  name: string;
  updatedAt: string;
  type: 'canvas' | 'document' | 'resource';
}

interface SiderState {
  // state
  collapse: boolean;
  showSiderDrawer: boolean;
  canvasList: SiderData[];
  libraryList: SiderData[];

  // method
  setCollapse: (val: boolean) => void;
  setShowSiderDrawer: (val: boolean) => void;
  setCanvasList: (val: SiderData[]) => void;
  setLibraryList: (val: SiderData[]) => void;
}

export const useSiderStore = create<SiderState>()(
  devtools((set) => ({
    collapse: false,
    showSiderDrawer: false,
    canvasList: [],
    libraryList: [],

    setCollapse: (val: boolean) => set({ collapse: val }),
    setShowSiderDrawer: (val: boolean) => set({ showSiderDrawer: val }),
    setCanvasList: (val: SiderData[]) => set({ canvasList: val }),
    setLibraryList: (val: SiderData[]) => set({ libraryList: val }),
  })),
);

export const useSiderStoreShallow = <T>(selector: (state: SiderState) => T) => {
  return useSiderStore(useShallow(selector));
};
