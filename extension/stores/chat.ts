import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type {} from "@redux-devtools/extension"
import { type Message, type SessionItem } from "~types"

export interface ChatState {
  // state
  messages: Message[]
  sessions: SessionItem[]
  newQAText: string
  isGenTitle: boolean
  isNewConversation: boolean

  // method
  setMessages: (val: Message[]) => void
  setIsGenTitle: (val: boolean) => void
  setNewQAText: (val: string) => void
  resetState: () => void
  setIsNewConversation: (val: boolean) => void
}

export const defaultState = {
  // messages: fakeMessages as any,
  messages: [],
  sessions: [],
  newQAText: "",
  isGenTitle: false,
  isNewConversation: false, // 标识是否是新创建的会话，还是老会话
}

export const useChatStore = create<ChatState>()(
  devtools((set) => ({
    ...defaultState,

    setMessages: (val: Message[]) =>
      set((state) => ({ ...state, messages: val })),
    setSessions: (val: SessionItem[]) => set({ sessions: val }),
    setIsGenTitle: (val: boolean) => set({ isGenTitle: val }),
    setNewQAText: (val: string) => set({ newQAText: val }),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
    setIsNewConversation: (val: boolean) => set({ isNewConversation: val }),
  })),
)
