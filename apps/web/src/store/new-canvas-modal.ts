import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { useShallow } from "zustand/react/shallow"

interface NewCanvasModalState {
  newCanvasModalVisible: boolean

  // scrape
  title: string
  description: string

  // save to collection
  selectedCollectionId: string

  setNewCanvasModalVisible: (visible: boolean) => void
  setTitle: (title: string) => void
  setDescription: (description: string) => void
  setSelectedCollectionId: (id: string) => void
  resetState: () => void
}

export const defaultState = {
  title: "",
  description: "",
  selectedCollectionId: "",
  newCanvasModalVisible: false,
}

export const useNewCanvasModalStore = create<NewCanvasModalState>()(
  devtools(set => ({
    ...defaultState,

    setNewCanvasModalVisible: (visible: boolean) =>
      set(state => ({ ...state, newCanvasModalVisible: visible })),
    setTitle: (title: string) => set(state => ({ ...state, title })),
    setDescription: (description: string) =>
      set(state => ({ ...state, description })),
    setSelectedCollectionId: (id: string) =>
      set(state => ({ ...state, selectedCollectionId: id })),
    resetState: () => set(state => ({ ...state, ...defaultState })),
  })),
)

export const useNewCanvasModalStoreShallow = <T>(
  selector: (state: NewCanvasModalState) => T,
) => {
  return useNewCanvasModalStore(useShallow(selector))
}
