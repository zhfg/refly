import { useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';
import { useMessageStateStoreShallow } from '@refly-packages/ai-workspace-common/stores/message-state';

export const useResetState = () => {
  const chatStore = useChatStoreShallow((state) => ({
    resetState: state.resetState,
  }));
  const messageStateStore = useMessageStateStoreShallow((state) => ({
    resetState: state.resetState,
  }));

  const resetState = () => {
    chatStore.resetState();
    messageStateStore.resetState();
  };

  return {
    resetState,
  };
};
