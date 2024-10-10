import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { Conversation, InvokeSkillRequest, ChatTask as Task } from '@refly/openapi-schema';
import { ConversationOperation } from '@refly/common-types';

interface TaskState {
  // state
  conversationList: Conversation[];

  // 新 feature，快捷操作
  task: InvokeSkillRequest | null;

  // method
  setConversationList: (conversationList: Conversation[]) => void;
  updateConversation: (operationType: ConversationOperation, payload: Partial<Conversation>) => void;

  setTask: (task: InvokeSkillRequest) => void;
}

export const useTaskStore = create<TaskState>()(
  devtools((set) => ({
    conversationList: [],
    task: null,

    setConversationList: (val: Conversation[]) => set({ conversationList: val }),
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
              createdAt: new Date().toJSON(),
              updatedAt: new Date().toJSON(),
              readEnhanceArticle: null,
              readEnhanceIndexStatus: null,
            } as Conversation;

            newConversationList = [newConversation].concat(conversationList);

            break;
          }

          case ConversationOperation.DELETE: {
            const { convId } = payload;
            newConversationList = conversationList.filter((item) => item.convId !== convId);

            break;
          }

          case ConversationOperation.UPDATE: {
            const { convId } = payload;
            newConversationList = conversationList.map((item) => {
              if (item.convId === convId) {
                return { ...item, ...payload };
              }

              return item;
            });

            break;
          }
        }

        return {
          ...state,
          conversationList: newConversationList,
        };
      }),
    setTask: (val: InvokeSkillRequest) => set((state) => ({ ...state, task: val })),
  })),
);

export const useTaskStoreShallow = <T>(selector: (state: TaskState) => T) => {
  return useTaskStore(useShallow(selector));
};
