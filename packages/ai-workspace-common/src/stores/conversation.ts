import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { Conversation, CreateConversationRequest } from '@refly/openapi-schema';
import { ConversationOperation } from '@refly/common-types';

interface ConversationState {
  // state
  currentConversation: Conversation | null;
  conversationList: Conversation[];
  isAskFollowUpNewConversation: boolean;

  // method
  setConversationList: (conversationList: Conversation[]) => void;
  setCurrentConversation: (val: Conversation) => void;
  updateConversation: (operationType: ConversationOperation, payload: Partial<Conversation>) => void;
  setIsAskFollowUpNewConversation: (val: boolean) => void;
  resetState: () => void;
}

const defaultState = {
  currentConversation: null,
  conversationList: [],
  isAskFollowUpNewConversation: false, // 标识是基于 AIGCContent 创建的新会话
};

export const useConversationStore = create<ConversationState>()(
  devtools((set) => ({
    ...defaultState,

    setConversationList: (val: Conversation[]) => set({ conversationList: val }),
    setCurrentConversation: (val: Conversation) => set({ currentConversation: val }),
    updateConversation: (operationType: ConversationOperation, payload: Partial<Conversation>) =>
      set((state) => {
        const conversationList = state.conversationList;
        let newConversationList = conversationList;

        switch (operationType) {
          case ConversationOperation.CREATE: {
            const { title = '新会话', origin, originPageTitle } = payload;
            const newConversation = {
              title: title ?? '新会话',
              origin,
              originPageTitle,
              readEnhanceArticle: null,
              readEnhanceIndexStatus: null,
            } as CreateConversationRequest;

            newConversationList = [newConversation].concat(conversationList);

            break;
          }

          case ConversationOperation.DELETE: {
            // const { convId } = payload
            // const newConversationList = conversationList.filter(
            //   item => item.convId !== convId,
            // )

            break;
          }

          case ConversationOperation.UPDATE: {
            // const { convId } = payload
            // const newConversationList = conversationList.map(item => {
            //   if (item.convId === convId) {
            //     return { ...item, ...payload }
            //   }

            //   return item
            // })

            break;
          }
        }

        return {
          ...state,
          conversationList: newConversationList,
        };
      }),
    setIsAskFollowUpNewConversation: (val: boolean) => set({ isAskFollowUpNewConversation: val }),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);

export const useConversationStoreShallow = <T>(selector: (state: ConversationState) => T) => {
  return useConversationStore(useShallow(selector));
};
