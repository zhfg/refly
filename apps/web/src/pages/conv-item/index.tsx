import { AICopilot } from "@refly-packages/ai-workspace-common/components/copilot"
import { MessageIntentSource } from "@refly-packages/ai-workspace-common/types/copilot"

const ConvItem = () => {
  return <AICopilot source={MessageIntentSource.ConversationDetail} />
}

export default ConvItem
