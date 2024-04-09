import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type {} from "@redux-devtools/extension"

interface ContentSelectorState {
  // state
  showContentSelector: boolean
  isInjectStyles: boolean

  // method
  setShowContentSelector: (val: boolean) => void
  setIsInjectStyles: (val: boolean) => void
}

export const defaultState = {
  showContentSelector: false,
  isInjectStyles: false,
}

export const useContentSelectorStore = create<ContentSelectorState>()(
  (set) => ({
    ...defaultState,

    setShowContentSelector: (val: boolean) => set({ showContentSelector: val }),
    setIsInjectStyles: (val: boolean) => set({ isInjectStyles: val }),
  }),
)
