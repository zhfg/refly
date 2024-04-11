import { create } from "zustand"
import type {} from "@redux-devtools/extension"
import type { Mark } from "~types"

interface ContentSelectorState {
  // state
  showContentSelector: boolean
  showSelectedMarks: boolean
  isInjectStyles: boolean
  marks: Mark[]

  // method
  setShowContentSelector: (val: boolean) => void
  setShowSelectedMarks: (val: boolean) => void
  setIsInjectStyles: (val: boolean) => void
  setMarks: (marks: Mark[]) => void
}

export const defaultState = {
  showSelectedMarks: false,
  showContentSelector: false,
  isInjectStyles: false,
  marks: [],
}

export const useContentSelectorStore = create<ContentSelectorState>()(
  (set) => ({
    ...defaultState,

    setShowContentSelector: (val: boolean) => set({ showContentSelector: val }),
    setShowSelectedMarks: (val: boolean) => set({ showSelectedMarks: val }),
    setIsInjectStyles: (val: boolean) => set({ isInjectStyles: val }),
    setMarks: (marks: Mark[]) => set({ marks }),
  }),
)
