import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import type { ClientChatMessage, IRuntime, SessionItem } from '@refly/common-types';
import { ModelInfo, SkillContext, SkillTemplateConfig, Source } from '@refly/openapi-schema';
import { IntentResult } from '@refly-packages/ai-workspace-common/hooks/use-handle-ai-canvas';

import { mockChatMessage, mockHumanMessage } from './mock-data';

// types
import type { CanvasEditConfig, InPlaceActionType } from '@refly/utils';
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';

export type ChatBehavior = 'askIntentMatch' | 'askFollowUp' | 'askNew';

export interface MessageIntentContext {
  isNewConversation: boolean;
  canvasEditConfig?: CanvasEditConfig;
  inPlaceActionType?: InPlaceActionType;
  projectContext?: {
    projectId: string;
    canvasId?: string;
  };
  resourceContext?: {
    resourceId?: string; // may sendMessage from resource's copilot
  };
  convId?: string;
  enableWebSearch?: boolean;
  enableDeepReasonWebSearch?: boolean;
  enableKnowledgeBaseSearch?: boolean;
  env: {
    runtime: IRuntime;
    source: MessageIntentSource;
  };
}

export interface ProjectInfo {
  projectId: string;
  title: string;
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
  selectedProject?: ProjectInfo;
  enableWebSearch: boolean;
  enableDeepReasonWebSearch: boolean;
  enableKnowledgeBaseSearch: boolean;
  intentMatcher: IntentResult | undefined;

  // method
  setMessages: (val: ClientChatMessage[]) => void;
  setIsGenTitle: (val: boolean) => void;
  setNewQAText: (val: string) => void;
  setIsFirstStreamContent: (val: boolean) => void;
  setInvokeParams: (val: { skillContext?: SkillContext; tplConfig?: SkillTemplateConfig }) => void;
  setMessageIntentContext: (val: MessageIntentContext) => void;
  setSelectedModel: (val: ModelInfo) => void;
  setSelectedProject: (val: ProjectInfo) => void;
  setModelList: (val: ModelInfo[]) => void;
  setEnableWebSearch: (val: boolean) => void;
  setEnableDeepReasonWebSearch: (val: boolean) => void;
  setEnableKnowledgeBaseSearch: (val: boolean) => void;
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
  enableWebSearch: true,
  enableDeepReasonWebSearch: false,
  enableKnowledgeBaseSearch: true,
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
  intentMatcher: undefined,

  selectedProject: null,
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
        setSelectedProject: (val: ProjectInfo) => set({ selectedProject: val }),
        setModelList: (val: ModelInfo[]) => set({ modelList: val }),
        setEnableWebSearch: (val: boolean) => set({ enableWebSearch: val }),
        setEnableDeepReasonWebSearch: (val: boolean) => set({ enableDeepReasonWebSearch: val }),
        setEnableKnowledgeBaseSearch: (val: boolean) => set({ enableKnowledgeBaseSearch: val }),
        setIntentMatcher: (val: IntentResult | undefined) => set({ intentMatcher: val }),
        resetState: () => {
          console.log('trigger resetState');
          return set((state) => ({ ...state, ...defaultExtraState }));
        },
      }),
      {
        name: 'chat-storage',
        partialize: (state) => ({
          newQAText: state.newQAText,
          selectedModel: state.selectedModel,
          selectedProject: state.selectedProject,
          enableWebSearch: state.enableWebSearch,
          enableKnowledgeBaseSearch: state.enableKnowledgeBaseSearch,
          enableDeepReasonWebSearch: state.enableDeepReasonWebSearch,
        }),
      },
    ),
  ),
);

export const useChatStoreShallow = <T>(selector: (state: ChatState) => T) => {
  return useChatStore(useShallow(selector));
};
