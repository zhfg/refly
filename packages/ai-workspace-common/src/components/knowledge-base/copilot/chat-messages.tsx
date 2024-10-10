// stores
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
// styles
import { AssistantMessage, HumanMessage, PendingMessage, WelcomeMessage } from './message';
import { useMessageStateStore } from '@refly-packages/ai-workspace-common/stores/message-state';
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import { memo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { MessageState } from '@refly/common-types';
import { ChatMessage } from '@refly/openapi-schema';
import { Skeleton } from '@arco-design/web-react';

interface ChatMessagesProps {
  disable?: boolean;
  loading?: boolean;
}

const messageStateSelector = (state: MessageState) => {
  return {
    pending: state.pending,
    pendingFirstToken: state.pendingFirstToken,
  };
};

const useMessages = () => useChatStore(useShallow((state) => state.messages));

export const ChatMessages = memo((props: ChatMessagesProps) => {
  const messages = useMessages();
  const userProfile = useUserStoreShallow((state) => state.userProfile);
  const messageStateStore = useMessageStateStore(messageStateSelector);
  const { runSkill } = useBuildThreadAndRun();
  const { loading } = props;

  const LoadingSkeleton = () => {
    return (
      <div style={{ padding: '20px 0' }}>
        <Skeleton animation />
        <Skeleton animation style={{ marginTop: '20px' }} />
      </div>
    );
  };

  const lastMessage = messages[messages.length - 1];
  const renderMessage = useCallback(
    (item: ChatMessage, index: number) => {
      if (item?.type === 'human') {
        return (
          <HumanMessage
            message={item}
            disable={props?.disable}
            key={item?.msgId}
            profile={{ avatar: userProfile?.avatar, name: userProfile?.nickname }}
          />
        );
      } else if (item?.type === 'ai') {
        return (
          <AssistantMessage
            disable={props?.disable}
            message={item}
            key={item?.msgId}
            isLastSession={index === messages.length - 1}
            isPendingFirstToken={messageStateStore?.pendingFirstToken as boolean}
            isPending={messageStateStore?.pending as boolean}
            handleAskFollowing={(question?: string) => {
              runSkill(question);
            }}
          />
        );
      }
    },
    [messages.length, lastMessage?.type, messageStateStore.pending, messageStateStore.pendingFirstToken],
  );

  return (
    <div className="ai-copilot-message-inner-container">
      {loading ? <LoadingSkeleton /> : messages.map(renderMessage)}
      {messages?.length === 0 && !loading ? <WelcomeMessage /> : null}
      {/* {messageStateStore?.pending && messageStateStore?.pendingFirstToken ? <PendingMessage /> : null} */}
    </div>
  );
});
