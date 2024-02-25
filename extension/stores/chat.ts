import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {} from '@redux-devtools/extension'
import type { Message } from '~types'


interface ChatState  {
    // state
    messages: Message[];
    newQAText: string;
    isGenTitle: boolean;

    // method
    setMessages: (val: Message[]) => void;
    setIsGenTitle: (val: boolean) => void
    setNewQAText: (val: string) => void
    resetState: () => void
}

const defaultState = {
    messages: [],
    newQAText: '',
    isGenTitle: false,
}

export const useChatStore = create<ChatState>()(devtools((set) => ({
    ...defaultState,

    setMessages: (val: Message[]) => set({ messages: val }),
    setIsGenTitle: (val: boolean) => set({ isGenTitle: val }),
    setNewQAText: (val: string) => set({ newQAText: val }),
    resetState: () => set(state => ({ ...state, ...defaultState }))
})))