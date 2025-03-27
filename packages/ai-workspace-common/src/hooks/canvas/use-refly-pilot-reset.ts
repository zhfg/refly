import { useEffect, useRef } from 'react';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { useContextPanelStoreShallow } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';
import { useLaunchpadStoreShallow } from '@refly-packages/ai-workspace-common/stores/launchpad';

/**
 * Hook to handle resetting Refly Pilot state when canvas ID changes
 * This includes clearing thread messages, context items, and other related state
 */
export const useReflyPilotReset = (canvasId: string) => {
  const prevCanvasIdRef = useRef<string | null>(null);

  const { clearLinearThreadMessages } = useCanvasStoreShallow((state) => ({
    clearLinearThreadMessages: state.clearLinearThreadMessages,
  }));

  const { setContextItems } = useContextPanelStoreShallow((state) => ({
    setContextItems: state.setContextItems,
  }));

  const { setNewQAText } = useChatStoreShallow((state) => ({
    setNewQAText: state.setNewQAText,
  }));

  const { setRecommendQuestionsOpen } = useLaunchpadStoreShallow((state) => ({
    setRecommendQuestionsOpen: state.setRecommendQuestionsOpen,
  }));

  // Reset Refly Pilot state when canvas ID changes
  useEffect(() => {
    // Skip on first render
    if (prevCanvasIdRef.current === null) {
      prevCanvasIdRef.current = canvasId;
      return;
    }

    // Only reset if canvas ID has changed
    if (prevCanvasIdRef.current !== canvasId) {
      // Clear thread messages
      clearLinearThreadMessages();

      // Clear context items
      setContextItems([]);

      // Clear chat input
      setNewQAText('');

      // Close recommend questions panel
      setRecommendQuestionsOpen(false);

      // Update previous canvas ID
      prevCanvasIdRef.current = canvasId;
    }
  }, [
    canvasId,
    clearLinearThreadMessages,
    setContextItems,
    setNewQAText,
    setRecommendQuestionsOpen,
  ]);

  return {
    resetReflyPilot: () => {
      clearLinearThreadMessages();
      setContextItems([]);
      setNewQAText('');
      setRecommendQuestionsOpen(false);
    },
  };
};
