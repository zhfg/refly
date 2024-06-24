// stores
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
// styles
import { AssistantMessage, HumanMessage, PendingMessage, WelcomeMessage } from './message';
import { useMessageStateStore } from '@refly-packages/ai-workspace-common/stores/message-state';
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';

interface ChatMessagesProps {}

export const ChatMessages = (props: ChatMessagesProps) => {
  const chatStore = useChatStore();
  const messageStateStore = useMessageStateStore();
  const { runTask } = useBuildThreadAndRun();

  return (
    <div className="ai-copilot-message-inner-container">
      {chatStore.messages.map((item, index) =>
        item?.type === 'human' ? (
          <HumanMessage message={item} key={index} />
        ) : (
          <AssistantMessage
            message={item}
            key={index}
            isLastSession={index === chatStore.messages.length - 1}
            isPending={messageStateStore?.pending as boolean}
            handleAskFollowing={(question?: string) => {
              runTask(question);
            }}
          />
        ),
      )}
      {chatStore?.messages?.length === 0 ? <WelcomeMessage /> : null}
      {messageStateStore?.pending && messageStateStore?.pendingFirstToken ? <PendingMessage /> : null}
    </div>
  );
};
