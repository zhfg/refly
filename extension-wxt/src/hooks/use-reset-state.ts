import { useQuickActionStore } from "@/src/stores/quick-action";
import { useChatStore } from "@/src/stores/chat";
import { useMessageStateStore } from "@/src/stores/message-state";
import { usePopupStore } from "@/src/stores/popup";

export const useResetState = () => {
  const quickActionStore = useQuickActionStore();
  const chatStore = useChatStore();
  const messageStateStore = useMessageStateStore();
  const popupStore = usePopupStore();

  const resetState = () => {
    chatStore.resetState(); // 新会话默认是没有创建 title 的状态
    messageStateStore.resetState();
    quickActionStore.resetState();
    popupStore.resetState();
  };

  return {
    resetState,
  };
};
