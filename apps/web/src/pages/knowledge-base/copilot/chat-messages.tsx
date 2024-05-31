// stores
import { useChatStore } from "@refly/ai-workspace-common/stores/chat"
// styles
import { MessageType } from "@refly/ai-workspace-common/types"
import {
  AssistantMessage,
  HumanMessage,
  PendingMessage,
  WelcomeMessage,
} from "./message"
import { mapToServerMessage } from "@refly/ai-workspace-common/utils/message"
import { useMessageStateStore } from "@refly/ai-workspace-common/stores/message-state"
import { useBuildThreadAndRun } from "@refly/ai-workspace-common/hooks/use-build-thread-and-run"

export const ChatMessages = () => {
  const chatStore = useChatStore()
  const messageStateStore = useMessageStateStore()
  const { runTask } = useBuildThreadAndRun()

  console.log("chatStore.messages", chatStore.messages)
  const mappedServerMessages = mapToServerMessage(chatStore.messages || [])

  return (
    <div className="ai-copilot-message-inner-container">
      {mappedServerMessages?.map((item, index) =>
        item?.type === MessageType.Human ? (
          <HumanMessage message={item} key={index} />
        ) : (
          <AssistantMessage
            message={item}
            key={index}
            isLastSession={index === mappedServerMessages?.length - 1}
            isPending={messageStateStore?.pending as boolean}
            handleAskFollowing={(question?: string) => {
              runTask(question)
            }}
          />
        ),
      )}
      {chatStore?.messages?.length === 0 ? <WelcomeMessage /> : null}
      {messageStateStore?.pending && messageStateStore?.pendingFirstToken ? (
        <PendingMessage />
      ) : null}
    </div>
  )
}
