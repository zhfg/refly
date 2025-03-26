import { memo, useCallback } from 'react';
import { LinearThread } from './linear-thread';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { genActionResultID, genUniqueId } from '@refly-packages/utils/id';

export const ReflyPilot = memo(() => {
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

  // Handler for adding new messages
  const handleAddMessage = useCallback(
    (message: { id: string; resultId: string; nodeId: string }) => {
      // Create the full message with timestamp
      const fullMessage = {
        id: message.id,
        resultId: message.resultId,
        nodeId: message.nodeId,
        timestamp: Date.now(),
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

  return (
    <LinearThread
      standalone={true}
      messages={linearThreadMessages}
      onAddMessage={handleAddMessage}
      onClearMessages={handleClearMessages}
      onGenerateMessageIds={handleGenerateMessageIds}
    />
  );
});
