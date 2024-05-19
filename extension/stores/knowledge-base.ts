import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type {} from "@redux-devtools/extension"

interface KnowledgeBaseState {
  isSaveKnowledgeBaseModalVisible: boolean

  updateIsSaveKnowledgeBaseModalVisible: (
    isSaveKnowledgeBaseModalVisible: boolean,
  ) => void
  resetState: () => void
}

export const defaultState = {
  isSaveKnowledgeBaseModalVisible: false,
}

export const useKnowledgeBaseStore = create<KnowledgeBaseState>()(
  devtools((set) => ({
    ...defaultState,

    updateIsSaveKnowledgeBaseModalVisible: (
      isSaveKnowledgeBaseModalVisible: boolean,
    ) => set((state) => ({ ...state, isSaveKnowledgeBaseModalVisible })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
)
