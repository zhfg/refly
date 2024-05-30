import { useChatStore } from "@/stores/chat"
import { useMessageStateStore } from "@/stores/message-state"
import { usePopupStore } from "@/stores/popup"

export const useResetState = () => {
  const chatStore = useChatStore()
  const messageStateStore = useMessageStateStore()
  const popupStore = usePopupStore()

  const resetState = () => {
    chatStore.resetState() // 新会话默认是没有创建 title 的状态
    messageStateStore.resetState()
    popupStore.resetState()
  }

  return {
    resetState,
  }
}
