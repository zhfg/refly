import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension';
import type { Message, SessionItem } from '@refly-packages/ai-workspace-common/types';

export interface ChatState {
  // state
  messages: Message[];
  sessions: SessionItem[];
  newQAText: string;
  isGenTitle: boolean;
  isNewConversation: boolean;
  isAskFollowUpNewConversation: boolean;

  // method
  setMessages: (val: Message[]) => void;
  setIsGenTitle: (val: boolean) => void;
  setNewQAText: (val: string) => void;
  resetState: () => void;
  setIsNewConversation: (val: boolean) => void;
  setIsAskFollowUpNewConversation: (val: boolean) => void;
}

export const defaultState = {
  // messages: fakeMessages as any,
  messages: [],
  sessions: [],
  newQAText: '',
  isGenTitle: false,
  isNewConversation: false, // 标识是否是新创建的会话，还是老会话
  isAskFollowUpNewConversation: false, // 标识是基于 AIGCContent 创建的新会话
};

export const useChatStore = create<ChatState>()(
  devtools((set) => ({
    ...defaultState,

    setMessages: (val: Message[]) => set((state) => ({ ...state, messages: val })),
    setSessions: (val: SessionItem[]) => set({ sessions: val }),
    setIsGenTitle: (val: boolean) => set({ isGenTitle: val }),
    setNewQAText: (val: string) => {
      return set({ newQAText: val });
    },
    resetState: () => {
      console.log('trigger resetState');
      return set((state) => ({ ...state, ...defaultState }));
    },
    setIsNewConversation: (val: boolean) => set({ isNewConversation: val }),
    setIsAskFollowUpNewConversation: (val: boolean) => set({ isAskFollowUpNewConversation: val }),
  })),
);
