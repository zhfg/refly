import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

interface NewCanvasModalState {
  newCanvasModalVisible: boolean;

  // scrape
  title: string;
  content: string;

  // save to collection
  selectedProjectId: string;

  setNewCanvasModalVisible: (visible: boolean) => void;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  setSelectedProjectId: (id: string) => void;
  resetState: () => void;
}

export const defaultState = {
  title: '',
  content: '',
  selectedProjectId: '',
  newCanvasModalVisible: false,
};

export const useNewCanvasModalStore = create<NewCanvasModalState>()(
  devtools((set) => ({
    ...defaultState,

    setNewCanvasModalVisible: (visible: boolean) => set((state) => ({ ...state, newCanvasModalVisible: visible })),
    setTitle: (title: string) => set((state) => ({ ...state, title })),
    setContent: (content: string) => set((state) => ({ ...state, content })),
    setSelectedProjectId: (id: string) => set((state) => ({ ...state, selectedProjectId: id })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);

export const useNewCanvasModalStoreShallow = <T>(selector: (state: NewCanvasModalState) => T) => {
  return useNewCanvasModalStore(useShallow(selector));
};
