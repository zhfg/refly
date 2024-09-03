import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { ClientChatMessage, SessionItem } from '@refly/common-types';
import { SkillContext, SkillTemplateConfig } from '@refly/openapi-schema';

export interface ChatState {
  // state
  messages: ClientChatMessage[];
  sessions: SessionItem[];
  newQAText: string;
  isGenTitle: boolean;

  // context
  invokeParams?: { skillContext?: SkillContext; tplConfig?: SkillTemplateConfig }; // for selected skill instance from copilot

  // method
  setMessages: (val: ClientChatMessage[]) => void;
  setIsGenTitle: (val: boolean) => void;
  setNewQAText: (val: string) => void;
  setInvokeParams: (val: { skillContext?: SkillContext; tplConfig?: SkillTemplateConfig }) => void;
  resetState: () => void;
}

export const defaultState = {
  // messages: fakeMessages as any,
  messages: [],
  sessions: [],
  newQAText: '',
  isGenTitle: false,
  invokeParams: undefined,
};

export const useChatStore = create<ChatState>()(
  devtools((set) => ({
    ...defaultState,

    setMessages: (val: ClientChatMessage[]) => set((state) => ({ ...state, messages: val })),
    setSessions: (val: SessionItem[]) => set({ sessions: val }),
    setIsGenTitle: (val: boolean) => set({ isGenTitle: val }),
    setNewQAText: (val: string) => {
      return set({ newQAText: val });
    },
    setInvokeParams: (val: { skillContext?: SkillContext; tplConfig?: SkillTemplateConfig }) =>
      set({ invokeParams: val }),
    resetState: () => {
      console.log('trigger resetState');
      return set((state) => ({ ...state, ...defaultState }));
    },
  })),
);
