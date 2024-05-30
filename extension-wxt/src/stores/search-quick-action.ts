import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type {} from "@redux-devtools/extension"

export interface SearchQuickActionState {
  // state
  showQuickAction: boolean

  // method
  setShowQuickAction: (showQuickAction: boolean) => void
}

export const defaultState = {
  showQuickAction: true,
}

export const useSearchQuickActionStore = create<SearchQuickActionState>()(
  devtools((set) => ({
    ...defaultState,

    setShowQuickAction: (showQuickAction: boolean) =>
      set((state) => ({ ...state, showQuickAction })),
  })),
)
