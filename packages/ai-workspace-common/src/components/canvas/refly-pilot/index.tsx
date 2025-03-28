import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { genActionResultID, genUniqueId } from '@refly-packages/utils/id';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';
import { ThreadContainer } from './thread-container';
import { useReflyPilotReset } from '@refly-packages/ai-workspace-common/hooks/canvas/use-refly-pilot-reset';

export const ReflyPilot = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { canvasId } = useCanvasContext();

  // Use the reset hook to handle canvas ID changes
  const { resetReflyPilot } = useReflyPilotReset(canvasId);

  const { setShowReflyPilot, linearThreadMessages, addLinearThreadMessage } = useCanvasStoreShallow(
    (state) => ({
      setShowReflyPilot: state.setShowReflyPilot,
      linearThreadMessages: state.linearThreadMessages,
      addLinearThreadMessage: state.addLinearThreadMessage,
      clearLinearThreadMessages: state.clearLinearThreadMessages,
    }),
  );

  // Extract the last message resultId for context updates
  const lastMessageResultId = useMemo(() => {
    const lastMessage = linearThreadMessages?.[linearThreadMessages.length - 1];
    return lastMessage?.resultId;
  }, [linearThreadMessages]);

  // Scroll to bottom effect
  useEffect(() => {
    if (containerRef.current) {
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [linearThreadMessages]);

  // Handler for adding new messages
  const handleAddMessage = useCallback(
    (message: { id: string; resultId: string; nodeId: string; data?: any }) => {
      // Create the full message with timestamp
      const fullMessage = {
        id: message.id,
        resultId: message.resultId,
        nodeId: message.nodeId,
        timestamp: Date.now(),
        data: message.data || { title: '', entityId: message.resultId },
      };

      // Add message to the global store
      addLinearThreadMessage(fullMessage);

      // Ensure Refly Pilot is visible
      setShowReflyPilot(true);
    },
    [addLinearThreadMessage, setShowReflyPilot],
  );

  // Handler for generating new message IDs
  const handleGenerateMessageIds = useCallback(() => {
    const newResultId = genActionResultID();
    const newNodeId = genUniqueId();
    return { resultId: newResultId, nodeId: newNodeId };
  }, []);

  // Handler for closing the Refly Pilot
  const handleClose = useCallback(() => {
    setShowReflyPilot(false);
  }, [setShowReflyPilot]);

  return (
    <ThreadContainer
      ref={containerRef}
      standalone={true}
      resultId={lastMessageResultId}
      messages={linearThreadMessages}
      onAddMessage={handleAddMessage}
      onClearConversation={resetReflyPilot}
      onGenerateMessageIds={handleGenerateMessageIds}
      onClose={handleClose}
    />
  );
});

ReflyPilot.displayName = 'ReflyPilot';
