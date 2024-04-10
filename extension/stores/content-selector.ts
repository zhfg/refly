import { create } from "zustand"
import type {} from "@redux-devtools/extension"
import type { Mark } from "~types"

interface ContentSelectorState {
  // state
  showContentSelector: boolean
  isInjectStyles: boolean
  marks: Mark[]

  // method
  setShowContentSelector: (val: boolean) => void
  setIsInjectStyles: (val: boolean) => void
  setMarks: (marks: Mark[]) => void
}

export const defaultState = {
  showContentSelector: false,
  isInjectStyles: false,
  marks: [],
}

export const useContentSelectorStore = create<ContentSelectorState>()(
  (set) => ({
    ...defaultState,

    setShowContentSelector: (val: boolean) => set({ showContentSelector: val }),
    setIsInjectStyles: (val: boolean) => set({ isInjectStyles: val }),
    setMarks: (marks: Mark[]) => set({ marks }),
  }),
)
