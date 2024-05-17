import { Markdown } from "@/components/markdown"
import { ServerMessage } from "@/types"

export const HumanMessage = (props: { message: Partial<ServerMessage> }) => {
  const { message } = props
  return (
    <div className="ai-copilot-message human-message-container">
      <div className="human-message">
        <Markdown content={message?.content as string} />
      </div>
    </div>
  )
}

export const AssistantMessage = (props: {
  message: Partial<ServerMessage>
}) => {
  const { message } = props
  return (
    <div className="ai-copilot-message assistant-message-container">
      <div className="assistant-message">
        <Markdown content={message?.content as string} />
      </div>
    </div>
  )
}
