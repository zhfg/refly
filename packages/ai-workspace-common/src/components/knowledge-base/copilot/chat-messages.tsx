// stores
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
// styles
import { AssistantMessage, HumanMessage, PendingMessage, WelcomeMessage } from './message';
import { useMessageStateStore } from '@refly-packages/ai-workspace-common/stores/message-state';
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { memo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { MessageState } from '@refly/common-types';
import { ChatMessage } from '@refly/openapi-schema';

interface ChatMessagesProps {}

const messageStateSelector = (state: MessageState) => {
  return {
    pending: state.pending,
    pendingFirstToken: state.pendingFirstToken,
  };
};

const useMessages = () => useChatStore(useShallow((state) => state.messages));

export const ChatMessages = memo((props: ChatMessagesProps) => {
  const messages = useMessages();
  const userProfile = useUserStore(useShallow((state) => state.userProfile));
  const messageStateStore = useMessageStateStore(useShallow(messageStateSelector));
  const { runSkill } = useBuildThreadAndRun();

  const lastMessage = messages[messages.length - 1];
  const renderMessage = useCallback(
    (item: ChatMessage, index: number) => {
      if (item?.type === 'human') {
        return (
          <HumanMessage
            message={item}
            key={item?.msgId}
            profile={{ avatar: userProfile?.avatar, name: userProfile?.name }}
          />
        );
      } else if (item?.type === 'ai') {
        return (
          <AssistantMessage
            message={item}
            key={item?.msgId}
            isLastSession={index === messages.length - 1}
            isPendingFirstToken={messageStateStore?.pendingFirstToken as boolean}
            isPending={messageStateStore?.pending as boolean}
            handleAskFollowing={runSkill}
          />
        );
      }
    },
    [messages.length, lastMessage?.type, messageStateStore.pending, messageStateStore.pendingFirstToken],
  );

  return (
    <div className="ai-copilot-message-inner-container">
      {messages.map(renderMessage)}
      {messages?.length === 0 ? <WelcomeMessage /> : null}
      {/* {messageStateStore?.pending && messageStateStore?.pendingFirstToken ? <PendingMessage /> : null} */}
    </div>
  );
});
