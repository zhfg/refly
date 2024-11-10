// stores
import { useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';
// styles
import { AssistantMessage, HumanMessage, WelcomeMessage } from './message';
import { useMessageStateStoreShallow } from '@refly-packages/ai-workspace-common/stores/message-state';
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import { memo, useCallback } from 'react';
import { ChatMessage } from '@refly/openapi-schema';
import { Skeleton } from '@arco-design/web-react';

interface ChatMessagesProps {
  disable?: boolean;
  loading?: boolean;
}

export const ChatMessages = memo((props: ChatMessagesProps) => {
  const messages = useChatStoreShallow((state) => state.messages);
  const userProfile = useUserStoreShallow((state) => state.userProfile);
  const messageStateStore = useMessageStateStoreShallow((state) => ({
    pending: state.pending,
    pendingFirstToken: state.pendingFirstToken,
  }));
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
            humanMessage={messages?.[index - 1]}
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
    </div>
  );
});
