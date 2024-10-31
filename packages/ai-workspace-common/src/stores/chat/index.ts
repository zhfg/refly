import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import type { ClientChatMessage, SessionItem } from '@refly/common-types';
import { ModelInfo, SkillContext, SkillTemplateConfig } from '@refly/openapi-schema';
import { IntentResult } from '@refly-packages/ai-workspace-common/hooks/use-handle-ai-canvas';

// types
import type { CanvasEditConfig } from '@refly/utils';
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';

export type ChatMode = 'normal' | 'noContext' | 'wholeSpace';
export type ChatBehavior = 'askIntentMatch' | 'askFollowUp' | 'askNew';

export interface MessageIntentContext {
  source: MessageIntentSource;
  isNewConversation: boolean;
  canvasEditConfig?: CanvasEditConfig;
  projectContext?: {
    projectId: string;
    canvasId?: string;
  };
  resourceContext?: {
    resourceId?: string; // may sendMessage from resource's copilot
  };
  convId?: string;
  chatMode?: ChatMode;
  enableWebSearch?: boolean;
}

export interface ChatState {
  // state
  messages: ClientChatMessage[];
  sessions: SessionItem[];
  newQAText: string;
  isGenTitle: boolean;
  isFirstStreamContent: boolean;

  messageIntentContext: MessageIntentContext | undefined; // has messageIntentContext means sendMessage interaction, otherwise means route jump interaction

  // context
  invokeParams?: { skillContext?: SkillContext; tplConfig?: SkillTemplateConfig }; // for selected skill instance from copilot
  // modelName?: string;
  modelList: ModelInfo[];
  selectedModel: ModelInfo;
  enableWebSearch: boolean;
  chatMode: ChatMode;
  intentMatcher: IntentResult | undefined;

  // method
  setMessages: (val: ClientChatMessage[]) => void;
  setIsGenTitle: (val: boolean) => void;
  setNewQAText: (val: string) => void;
  setIsFirstStreamContent: (val: boolean) => void;
  setInvokeParams: (val: { skillContext?: SkillContext; tplConfig?: SkillTemplateConfig }) => void;
  setMessageIntentContext: (val: MessageIntentContext) => void;
  setSelectedModel: (val: ModelInfo) => void;
  setModelList: (val: ModelInfo[]) => void;
  setEnableWebSearch: (val: boolean) => void;
  setChatMode: (val: ChatMode) => void;
  setIntentMatcher: (val: IntentResult | undefined) => void;
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

  isFirstStreamContent: true,
  messageIntentContext: undefined,

  sessions: [],
  newQAText: '',
  isGenTitle: false,
  invokeParams: undefined,
  chatMode: 'normal' as ChatMode, // future support memory config
  intentMatcher: undefined,
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
        setIsFirstStreamContent: (val: boolean) => set({ isFirstStreamContent: val }),
        setMessageIntentContext: (val: MessageIntentContext) => set({ messageIntentContext: val }),
        setInvokeParams: (val: { skillContext?: SkillContext; tplConfig?: SkillTemplateConfig }) =>
          set({ invokeParams: val }),
        setSelectedModel: (val: ModelInfo) => set({ selectedModel: val }),
        setModelList: (val: ModelInfo[]) => set({ modelList: val }),
        setEnableWebSearch: (val: boolean) => set({ enableWebSearch: val }),
        setChatMode: (val: ChatMode) => set({ chatMode: val }),
        setIntentMatcher: (val: IntentResult | undefined) => set({ intentMatcher: val }),
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
