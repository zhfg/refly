import { memo, useState } from 'react';
import {
  CanvasNode,
  ResponseNodeMeta,
} from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { LinearThread } from '@refly-packages/ai-workspace-common/components/canvas/refly-pilot/linear-thread';
import { cn } from '@refly-packages/utils/cn';
import { useFindThreadHistory } from '@refly-packages/ai-workspace-common/hooks/canvas/use-find-thread-history';
import { useEffect } from 'react';

interface LinearThreadMessage {
  id: string;
  resultId: string;
  nodeId: string;
  timestamp: number;
}

interface EnhancedSkillResponseProps {
  node: CanvasNode<ResponseNodeMeta>;
  resultId: string;
  className?: string;
}

export const EnhancedSkillResponse = memo(
  ({ node, resultId, className }: EnhancedSkillResponseProps) => {
    const [messages, setMessages] = useState<LinearThreadMessage[]>([]);
    const findThreadHistory = useFindThreadHistory();

    // Initialize messages from resultId and its thread history
    useEffect(() => {
      if (resultId && node) {
        // Find thread history based on resultId
        const threadHistory = findThreadHistory({ resultId });

        // Initialize with empty messages array
        const initialMessages: LinearThreadMessage[] = [];

        // Add all history nodes to messages
        const allNodes = [...threadHistory, node];

        allNodes.forEach((historyNode, index) => {
          const nodeResultId = historyNode?.data?.entityId;
          if (nodeResultId) {
            initialMessages.push({
              id: `history-${historyNode.id}-${index}`,
              resultId: nodeResultId,
              nodeId: historyNode.id,
              timestamp: Date.now() - (allNodes.length - index) * 1000, // Ensure proper ordering
            });
          }
        });

        setMessages(initialMessages);
      }
    }, [resultId, node, findThreadHistory]);

    // Handler for adding new messages
    const handleAddMessage = (message: Omit<LinearThreadMessage, 'timestamp'>) => {
      setMessages((prev) => [...prev, { ...message, timestamp: Date.now() }]);
    };

    return (
      <div className={cn('flex flex-col h-full w-full', className)}>
        <div className="flex flex-1 overflow-hidden">
          <LinearThread
            resultId={resultId}
            node={node}
            standalone={false}
            className="h-full w-full"
            initialMessages={messages}
            useResultIdMapping={true}
            onAddMessage={handleAddMessage}
          />
        </div>
      </div>
    );
  },
);
