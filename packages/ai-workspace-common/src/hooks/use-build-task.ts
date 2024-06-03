import { useCallback, useRef } from 'react';
import { useChatStore } from '../stores/chat';
import { useMessageStateStore } from '../stores/message-state';
import { useConversationStore } from '../stores/conversation';
import { Source } from '@refly/openapi-schema';
import type { MessageState, RelatedQuestion } from '@refly-packages/ai-workspace-common/types';
import { TASK_STATUS } from '@refly-packages/ai-workspace-common/types';
import type { ChatTask } from '@refly/openapi-schema';
import { buildQuestionMessage, buildReplyMessage } from '@refly-packages/ai-workspace-common/utils/message';

import { buildErrorMessage } from '@refly-packages/ai-workspace-common/utils/message';
import { scrollToBottom } from '@refly-packages/ai-workspace-common/utils/ui';

// requests
import { parseStreaming } from '@refly-packages/ai-workspace-common/utils/parse-streaming';
// stores

export const useBuildTask = () => {
  const chatStore = useChatStore();
  const messageStateStore = useMessageStateStore();
  const conversationStore = useConversationStore();
  // 中断生成
  const controllerRef = useRef<AbortController>();

  const buildTaskAndGenReponse = (task: ChatTask) => {
    console.log('buildTaskAndGenReponse', task);
    const question = task.data?.question;
    const { messages = [] } = useChatStore.getState();
    const { currentConversation } = useConversationStore.getState();

    // 构建 filter, for follow ask question config
    const weblinkList = task?.data?.filter?.weblinkList || [];
    const selectedWeblinkConfig = {
      searchTarget: weblinkList?.length > 0 ? 'selectedPages' : 'all',
      filter: weblinkList,
    };

    const questionMsg = buildQuestionMessage({
      convId: currentConversation?.convId || '',
      content: question,
      selectedWeblinkConfig: JSON.stringify(selectedWeblinkConfig),
    });
    const replyMsg = buildReplyMessage({
      convId: currentConversation?.convId || '',
      content: '',
      questionId: questionMsg?.msgId,
    });
    // 将 reply 加到 message-state
    messageStateStore.setMessageState({
      pendingReplyMsg: replyMsg,
      taskType: task?.taskType,
    });

    chatStore.setMessages(messages.concat(questionMsg));

    handleGenResponse(task);

    setTimeout(() => {
      // 滑动到底部
      scrollToBottom();
    });
  };

  const buildShutdownTaskAndGenResponse = () => {
    controllerRef.current?.abort();
    handleSendMessage({
      body: {
        type: TASK_STATUS.SHUTDOWN,
      },
    });
  };

  const handleGenResponse = useCallback(
    (task: ChatTask) => {
      // 发起一个 gen 请求，开始接收
      messageStateStore.setMessageState({
        pending: true,
        pendingFirstToken: true,
        taskType: task?.taskType,
        pendingMsg: '',
        error: false,
      });

      // 直接发送 task
      handleSendMessage({
        body: {
          type: TASK_STATUS.START,
          payload: task,
        },
      });
    },
    [conversationStore.currentConversation?.convId],
  );

  const onContent = (content: string) => {
    const currentChatState = useChatStore.getState();

    // 没有消息时，先创建
    const lastMessage = currentChatState.messages.at(-1);
    const savedMessage = currentChatState.messages.slice(0, -1);

    lastMessage.content = content;
    chatStore.setMessages([...savedMessage, { ...lastMessage }]);
  };

  const onSources = (sources: Source[]) => {
    const currentMessageState = useMessageStateStore.getState();
    const currentChatState = useChatStore.getState();

    let lastMessage, savedMessage;
    if (currentMessageState.pendingFirstToken) {
      lastMessage = currentMessageState.pendingReplyMsg;
      savedMessage = currentChatState.messages;

      lastMessage.data.content = '';
      messageStateStore.setMessageState({ pendingFirstToken: false });
    } else {
      lastMessage = currentChatState.messages.at(-1);
      savedMessage = currentChatState.messages.slice(0, -1);
    }

    console.log('sourceWeblinkPayload', sources);
    messageStateStore.setMessageState({
      ...currentMessageState,
      pendingFirstToken: false,
      pendingSourceDocs: (currentMessageState.pendingSourceDocs || [])?.concat(sources)?.filter((item) => item),
    });

    console.log('sourceWeblinkPayload', currentChatState.messages);

    if (Array.isArray(lastMessage?.data?.sources)) {
      lastMessage.data.sources = lastMessage?.data?.sources?.concat(sources || [])?.filter((item) => item);
    } else {
      lastMessage.data.sources = [...sources]?.filter((item) => item);
    }
    chatStore.setMessages([...savedMessage, { ...lastMessage }]);

    // 更新消息之后滚动到底部
    setTimeout(() => {
      scrollToBottom();
    }, 1000);
  };

  const onRelated = (related: RelatedQuestion[]) => {
    const currentMessageState = useMessageStateStore.getState();
    const currentChatState = useChatStore.getState();

    console.log('related question', related);
    messageStateStore.setMessageState({
      ...currentMessageState,
      pending: false,
      pendingFirstToken: true,
      pendingRelatedQuestions: (currentMessageState.pendingRelatedQuestions || [])
        ?.concat(related)
        ?.filter((item) => item),
    });

    const lastMessage = currentChatState.messages.at(-1);
    const savedMessage = currentChatState.messages.slice(0, -1);

    console.log('latest related question', lastMessage?.relatedQuestions);

    if (Array.isArray(lastMessage?.relatedQuestions)) {
      lastMessage.relatedQuestions = lastMessage?.relatedQuestions?.concat(related || [])?.filter((item) => item);
    } else {
      lastMessage.relatedQuestions = [...related]?.filter((item) => item);
    }
    chatStore.setMessages([...savedMessage, { ...lastMessage }]);
  };

  const onError = (status: number) => {
    const currentChatState = useChatStore.getState();
    console.log('status', status);
    controllerRef.current?.abort();

    const newMessageState: Partial<MessageState> = {
      pending: false,
      error: false,
    };

    // 构建一条错误消息放在末尾，而不是类似 loading 直接展示，因为要 error 停留在聊天列表里
    const errMsg = buildErrorMessage({
      convId: conversationStore.currentConversation?.convId || '',
    });

    chatStore.setMessages([...currentChatState.messages, { ...errMsg }]);

    // 更新消息之后滚动到底部
    setTimeout(() => {
      scrollToBottom();
    }, 1000);

    newMessageState.error = true;
    newMessageState.pendingFirstToken = false;

    // 更新 messageState 的状态，然后直接结束，不走后面的流程
    messageStateStore.setMessageState(newMessageState);
  };

  const handleSendMessage = (payload: {
    body: {
      type: TASK_STATUS;
      payload?: ChatTask;
    };
  }) => {
    controllerRef.current = new AbortController();

    parseStreaming(controllerRef.current, payload?.body?.payload, onSources, onContent, onRelated, onError);
  };

  return {
    buildTaskAndGenReponse,
    buildShutdownTaskAndGenResponse,
  };
};
