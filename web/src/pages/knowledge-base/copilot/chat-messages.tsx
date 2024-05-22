// stores
import { useChatStore } from "@/stores/chat"
// styles
import { MessageType } from "@/types"
import { AssistantMessage, HumanMessage } from "./message"
import { mapToServerMessage } from "@/utils/message"

export const ChatMessages = () => {
  const chatStore = useChatStore()

  const mappedServerMessages = mapToServerMessage(chatStore.messages || [])

  return (
    <div className="ai-copilot-message-inner-container">
      {mappedServerMessages?.map((item, index) =>
        item.type === MessageType.Human ? (
          <HumanMessage message={item} key={index} />
        ) : (
          <AssistantMessage message={item} key={index} />
        ),
      )}
    </div>
  )
}
