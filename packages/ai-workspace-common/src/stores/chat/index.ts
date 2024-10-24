import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import type { ClientChatMessage, SessionItem } from '@refly/common-types';
import { ModelInfo, SkillContext, SkillTemplateConfig } from '@refly/openapi-schema';

export type ChatMode = 'normal' | 'noContext' | 'wholeSpace';

export interface ChatState {
  // state
  messages: ClientChatMessage[];
  sessions: SessionItem[];
  newQAText: string;
  isGenTitle: boolean;

  // context
  invokeParams?: { skillContext?: SkillContext; tplConfig?: SkillTemplateConfig }; // for selected skill instance from copilot
  // modelName?: string;
  modelList: ModelInfo[];
  selectedModel: ModelInfo;
  enableWebSearch: boolean;
  chatMode: ChatMode;

  // method
  setMessages: (val: ClientChatMessage[]) => void;
  setIsGenTitle: (val: boolean) => void;
  setNewQAText: (val: string) => void;
  setInvokeParams: (val: { skillContext?: SkillContext; tplConfig?: SkillTemplateConfig }) => void;
  setSelectedModel: (val: ModelInfo) => void;
  setModelList: (val: ModelInfo[]) => void;
  setEnableWebSearch: (val: boolean) => void;
  setChatMode: (val: ChatMode) => void;
  resetState: () => void;
}

const defaultConfigurableState = {
  selectedModel: {
    label: 'GPT-4o Mini',
    name: 'openai/gpt-4o-mini',
    provider: 'openai',
    tier: 't2',
  },
  modelList: [
    {
      label: 'GPT-4o Mini',
      name: 'openai/gpt-4o-mini',
      provider: 'openai',
      tier: 't2',
    },
  ] as ModelInfo[],
  enableWebSearch: false,
};

export const defaultExtraState = {
  // messages: fakeMessages as any,
  messages: [],
  sessions: [],
  newQAText: '',
  isGenTitle: false,
  invokeParams: undefined,
  chatMode: 'normal' as ChatMode, // future support memory config
};

export const defaultState = {
  ...defaultConfigurableState,
  ...defaultExtraState,
};

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set) => ({
        ...defaultState,

        setMessages: (val: ClientChatMessage[]) => set((state) => ({ ...state, messages: val })),
        setSessions: (val: SessionItem[]) => set({ sessions: val }),
        setIsGenTitle: (val: boolean) => set({ isGenTitle: val }),
        setNewQAText: (val: string) => {
          return set({ newQAText: val });
        },
        setInvokeParams: (val: { skillContext?: SkillContext; tplConfig?: SkillTemplateConfig }) =>
          set({ invokeParams: val }),
        setSelectedModel: (val: ModelInfo) => set({ selectedModel: val }),
        setModelList: (val: ModelInfo[]) => set({ modelList: val }),
        setEnableWebSearch: (val: boolean) => set({ enableWebSearch: val }),
        setChatMode: (val: ChatMode) => set({ chatMode: val }),
        resetState: () => {
          console.log('trigger resetState');
          return set((state) => ({ ...state, ...defaultExtraState }));
        },
      }),
      {
        name: 'chat-storage',
        partialize: (state) => ({ selectedModel: state.selectedModel }),
      },
    ),
  ),
);

export const useChatStoreShallow = <T>(selector: (state: ChatState) => T) => {
  return useChatStore(useShallow(selector));
};
