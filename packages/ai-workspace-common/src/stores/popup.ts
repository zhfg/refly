import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
interface PopupState {
  // state
  popupVisible: boolean;

  // method
  setPopupVisible: (val: boolean) => void;
  resetState: () => void;
}

const defaultState = {
  popupVisible: false,
};

export const usePopupStore = create<PopupState>()(
  devtools((set) => ({
    ...defaultState,

    setPopupVisible: (val: boolean) => set({ popupVisible: val }),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);

export const usePopupStoreShallow = <T>(selector: (state: PopupState) => T) => {
  return usePopupStore(useShallow(selector));
};
