import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useMessageStateStore } from '@refly-packages/ai-workspace-common/stores/message-state';
import { usePopupStore } from '@refly-packages/ai-workspace-common/stores/popup';

export const useResetState = () => {
  const chatStore = useChatStore((state) => ({
    resetState: state.resetState,
  }));
  const messageStateStore = useMessageStateStore((state) => ({
    resetState: state.resetState,
  }));
  const popupStore = usePopupStore((state) => ({
    resetState: state.resetState,
  }));

  const resetState = () => {
    chatStore.resetState(); // 新会话默认是没有创建 title 的状态
    messageStateStore.resetState();
    popupStore.resetState();
  };

  return {
    resetState,
  };
};
