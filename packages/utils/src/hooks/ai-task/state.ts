import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ChatMessage, ChatTaskType, Conversation } from '@refly/openapi-schema';
import { ConversationOperation, MessageState, SessionItem } from '@refly/common-types';

/**
 * 将 message、chat、conversation 等状态合在一起，统一处理临时的 AI Chat
 */
interface ChatTaskState extends MessageState {
  // conversation state
  currentConversation: Conversation;
  conversationList: Conversation[];
  // chat state
  messages: ChatMessage[];
  sessions: SessionItem[];
  newQAText: string;
  isGenTitle: boolean;
  isNewConversation: boolean;
  isAskFollowUpNewConversation: boolean;

  // conversation method
  setConversationList: (conversationList: Conversation[]) => void;
  setCurrentConversation: (val: Conversation) => void;
  updateConversation: (operationType: ConversationOperation, payload: Partial<Conversation>) => void;

  // chat method
  setMessages: (val: ChatMessage[]) => void;
  setIsGenTitle: (val: boolean) => void;
  setNewQAText: (val: string) => void;
  resetState: () => void;
  setIsNewConversation: (val: boolean) => void;
  setIsAskFollowUpNewConversation: (val: boolean) => void;

  // message-state method
  setMessageState: (val: MessageState) => void;
}

export const defaultResetState = {
  // conversation state
  currentConversation: null,
  conversationList: [],

  // chat state
  messages: [],
  sessions: [],
  newQAText: '',
  isGenTitle: false,
  isNewConversation: false, // 标识是否是新创建的会话，还是老会话
  isAskFollowUpNewConversation: false, // 标识是基于 AIGCContent 创建的新会话

  // message state
  pendingMsg: '', // 生成中的 msg
  pendingFirstToken: true, // 是否正在准备生成，如果收到第一个字符，即代表已经开始生生成
  pending: false, // 是否正在生成，表示一次任务生成是否正在进行中
  error: false, // 此次信息是否出错，比如还没开始生成就 abort，显示错误信息
  pendingReplyMsg: null, // 即将生成的 replyMsg 对象
  taskType: 'chat' as ChatTaskType,
  history: [], // 本次聊天历史
  pendingSourceDocs: [], // 实现搜索知识库时，给出的答案引用来源，也是流式获取
  pendingRelatedQuestions: [], // 实现搜索知识库时，给出的答案引用来源，也是流式获取}
};

export const defaultState = {
  ...defaultResetState,
};

export const useChatTaskStore = create<ChatTaskState>()(
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
            } as Conversation;

            newConversationList = [newConversation].concat(conversationList);

            break;
          }

          case ConversationOperation.DELETE: {
            const { convId } = payload;
            const newConversationList = conversationList.filter((item) => item.convId !== convId);

            break;
          }

          case ConversationOperation.UPDATE: {
            const { convId } = payload;
            const newConversationList = conversationList.map((item) => {
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

    // chat state
    setMessages: (val: ChatMessage[]) => set((state) => ({ ...state, messages: val })),
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

    // message state
    setMessageState: (val: MessageState) => set((state) => ({ ...state, ...val })),
  })),
);
