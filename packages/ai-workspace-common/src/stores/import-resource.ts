import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ImportResourceState {
  importResourceModalVisible: boolean;

  setImportResourceModalVisible: (visible: boolean) => void;
  resetState: () => void;
}

export const defaultState = {
  importResourceModalVisible: false,
};

export const useImportResourceStore = create<ImportResourceState>()(
  devtools((set) => ({
    ...defaultState,

    setImportResourceModalVisible: (visible: boolean) =>
      set((state) => ({ ...state, importResourceModalVisible: visible })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);
