import { memo, useCallback, useEffect, useRef } from 'react';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { genActionResultID, genUniqueId } from '@refly-packages/utils/id';
import { ThreadContainer } from './thread-container';

export const ReflyPilot = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    setShowReflyPilot,
    linearThreadMessages,
    addLinearThreadMessage,
    clearLinearThreadMessages,
  } = useCanvasStoreShallow((state) => ({
    setShowReflyPilot: state.setShowReflyPilot,
    linearThreadMessages: state.linearThreadMessages,
    addLinearThreadMessage: state.addLinearThreadMessage,
    clearLinearThreadMessages: state.clearLinearThreadMessages,
  }));

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

  // Handler for clearing messages
  const handleClearMessages = useCallback(() => {
    clearLinearThreadMessages();
  }, [clearLinearThreadMessages]);

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
      messages={linearThreadMessages}
      onAddMessage={handleAddMessage}
      onClearMessages={handleClearMessages}
      onGenerateMessageIds={handleGenerateMessageIds}
      onClose={handleClose}
    />
  );
});

ReflyPilot.displayName = 'ReflyPilot';
