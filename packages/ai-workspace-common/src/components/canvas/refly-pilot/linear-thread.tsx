import { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'antd';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { SkillResponseNodePreview } from '@refly-packages/ai-workspace-common/components/canvas/node-preview/skill-response';
import { cn } from '@refly-packages/utils/cn';
import {
  IconClose,
  IconExpand,
  IconShrink,
} from '@refly-packages/ai-workspace-common/components/common/icon';
import { LaunchPad } from '@refly-packages/ai-workspace-common/components/canvas/launchpad';
import { useFindThreadHistory } from '@refly-packages/ai-workspace-common/hooks/canvas/use-find-thread-history';
import { RefreshCw } from 'lucide-react';
import { useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';
import {
  CanvasNode,
  ResponseNodeMeta,
} from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { useContextPanelStoreShallow } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useContextUpdateByResultId } from '@refly-packages/ai-workspace-common/hooks/canvas/use-debounced-context-update';

interface LinearThreadMessage {
  id: string;
  resultId: string;
  nodeId: string;
  timestamp: number;
}

interface ReflyPilotProps {
  className?: string;
  resultId?: string;
  node?: CanvasNode<ResponseNodeMeta>;
  standalone?: boolean;
  initialMessages?: LinearThreadMessage[];
  useResultIdMapping?: boolean;
  onAddMessage?: (message: Omit<LinearThreadMessage, 'timestamp'>) => void;
}

const LinearThreadHeader = memo(
  ({
    onClose,
    onMaximize,
    isMaximized,
    onClearConversation,
  }: {
    onClose: () => void;
    onMaximize: () => void;
    isMaximized: boolean;
    onClearConversation: () => void;
  }) => {
    const { t } = useTranslation();

    return (
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-500 shadow-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-medium">P</span>
          </div>
          <span className="text-sm font-medium leading-normal">
            {t('canvas.reflyPilot.title', { defaultValue: 'Refly Pilot' })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="text"
            size="small"
            className="flex items-center text-gray-600 h-7 px-2"
            onClick={onClearConversation}
            icon={<RefreshCw className="w-3.5 h-3.5 mr-1" />}
          >
            {t('canvas.reflyPilot.newConversation', { defaultValue: 'New conversation' })}
          </Button>
          <Button
            type="text"
            size="small"
            className="flex items-center justify-center p-0 w-7 h-7 text-gray-400 hover:text-gray-600 min-w-0"
            onClick={onMaximize}
          >
            {isMaximized ? <IconShrink className="w-4 h-4" /> : <IconExpand className="w-4 h-4" />}
          </Button>
          <Button
            type="text"
            size="small"
            className="flex items-center justify-center p-0 w-7 h-7 text-gray-400 hover:text-gray-600 min-w-0"
            onClick={onClose}
          >
            <IconClose className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  },
);

// Optimize SkillResponseNodePreview with memo
const MemoizedSkillResponseNodePreview = memo(SkillResponseNodePreview, (prevProps, nextProps) => {
  return (
    prevProps.resultId === nextProps.resultId &&
    prevProps.node.data?.entityId === nextProps.node.data?.entityId
  );
});

export const LinearThreadContent = memo(
  ({
    messagesWithHistory,
    messagesContainerRef,
    contentHeight,
  }: {
    messagesWithHistory: any[];
    messagesContainerRef: React.RefObject<HTMLDivElement>;
    contentHeight: string | number;
  }) => {
    const sortedMessages = messagesWithHistory;

    console.log('sortedMessages', sortedMessages);

    return (
      <div
        ref={messagesContainerRef}
        className="flex-grow overflow-auto preview-container"
        style={{ height: contentHeight, width: '100%' }}
      >
        {sortedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500">
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y">
            {sortedMessages.map((message) => (
              <div key={message.id}>
                <MemoizedSkillResponseNodePreview
                  node={{
                    id: message.nodeId,
                    type: 'skillResponse',
                    position: { x: 0, y: 0 },
                    data: {
                      entityId: message.resultId,
                      title: 'Refly Pilot Response',
                      metadata: {
                        status: 'finish',
                      },
                    },
                  }}
                  resultId={message.resultId}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);

export const LinearThread = memo(
  ({
    className,
    resultId,
    node,
    standalone = true,
    initialMessages = [],
    useResultIdMapping = false,
    onAddMessage,
  }: ReflyPilotProps) => {
    const [isMaximized, setIsMaximized] = useState(false);
    const [contentHeight, setContentHeight] = useState('auto');
    const [localMessages, setLocalMessages] = useState<LinearThreadMessage[]>(initialMessages);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const findThreadHistory = useFindThreadHistory();

    const { setShowReflyPilot, clearLinearThreadMessages, addLinearThreadMessage } =
      useCanvasStoreShallow((state) => ({
        setShowReflyPilot: state.setShowReflyPilot,
        clearLinearThreadMessages: state.clearLinearThreadMessages,
        addLinearThreadMessage: state.addLinearThreadMessage,
      }));

    // Add context panel store to manage context items
    const { setContextItems } = useContextPanelStoreShallow((state) => ({
      setContextItems: state.setContextItems,
    }));

    const { setNewQAText } = useChatStoreShallow((state) => ({
      setNewQAText: state.setNewQAText,
    }));

    // Use our new custom hook instead of the local implementation
    const { debouncedUpdateContextItems } = useContextUpdateByResultId({
      standalone,
      resultId,
      setContextItems,
    });

    // Add local methods to manage messages
    const addLocalMessage = useCallback(
      (message: Omit<LinearThreadMessage, 'timestamp'>) => {
        const newMessage = {
          ...message,
          timestamp: Date.now(),
        };
        setLocalMessages((prev) => [...prev, newMessage]);

        // Also call external handler if provided
        if (onAddMessage) {
          onAddMessage(message);
        }

        // For backward compatibility
        if (!useResultIdMapping) {
          addLinearThreadMessage(newMessage);
        }
      },
      [addLinearThreadMessage, onAddMessage, useResultIdMapping],
    );

    const clearLocalMessages = useCallback(() => {
      setLocalMessages([]);
      if (!useResultIdMapping) {
        clearLinearThreadMessages();
      }
    }, [clearLinearThreadMessages, useResultIdMapping]);

    // Initialize with thread history if resultId is provided
    useEffect(() => {
      if (resultId && node) {
        // If we already have messages for this result, skip initialization
        if (localMessages.some((msg) => msg.resultId === resultId)) {
          return;
        }

        // Find thread history based on resultId
        const threadHistory = findThreadHistory({ resultId });

        // Get existing resultIds in messages for comparison
        const existingResultIds = new Set(localMessages.map((msg) => msg.resultId));

        // Track if we need to add any new messages
        let addedNewMessages = false;

        // Process all history nodes including current one
        const allNodes = [...threadHistory, node];

        // Add all history nodes to messages with appropriate timestamps if not already there
        allNodes.forEach((historyNode, index) => {
          const nodeResultId = historyNode?.data?.entityId;
          if (nodeResultId && !existingResultIds.has(nodeResultId)) {
            const newMessage = {
              id: `history-${historyNode.id}-${index}`,
              resultId: nodeResultId,
              nodeId: historyNode.id,
              timestamp: Date.now() - (allNodes.length - index) * 1000, // Ensure proper ordering
            };

            setLocalMessages((prev) => [...prev, newMessage]);
            addedNewMessages = true;
            existingResultIds.add(nodeResultId); // Mark as added
          }
        });

        // If we didn't add any new messages and resultId isn't in messages yet, add it
        if (!addedNewMessages && !existingResultIds.has(resultId)) {
          const newMessage = {
            id: `current-${node.id}`,
            resultId: resultId,
            nodeId: node.id,
            timestamp: Date.now(),
          };

          setLocalMessages((prev) => [...prev, newMessage]);
        }
      }
    }, [resultId, node, findThreadHistory, localMessages]);

    // Cache thread history for each message
    const messagesWithHistory = useMemo(() => {
      // Use local messages as the source
      const sourceMessages = localMessages;

      // If resultId is provided, prioritize showing messages related to this result and its history
      if (resultId) {
        // Find the complete thread history for this result
        const threadHistory = findThreadHistory({ resultId });
        const historyIds = new Set(
          threadHistory.map((node) => node.data?.entityId).filter(Boolean),
        );

        // Include the selected resultId
        historyIds.add(resultId);

        // Filter messages to show only those relevant to this result's conversation thread
        const relevantMessages = sourceMessages.filter((message) =>
          historyIds.has(message.resultId),
        );

        // Sort by timestamp to ensure correct ordering
        const sortedMessages = [...relevantMessages].sort((a, b) => a.timestamp - b.timestamp);

        return sortedMessages.map((message) => ({
          ...message,
          threadHistory: findThreadHistory({ resultId: message.resultId }),
        }));
      }

      // Default case: show all messages sorted by timestamp
      const sortedMessages = [...sourceMessages].sort((a, b) => a.timestamp - b.timestamp);
      return sortedMessages.map((message) => ({
        ...message,
        threadHistory: findThreadHistory({ resultId: message.resultId }),
      }));
    }, [localMessages, findThreadHistory, resultId]);

    const handleClose = useCallback(() => {
      setShowReflyPilot(false);
    }, [setShowReflyPilot]);

    const handleMaximize = useCallback(() => {
      setIsMaximized(!isMaximized);
    }, [isMaximized]);

    const handleClearConversation = useCallback(() => {
      // Clear all messages
      clearLocalMessages();
      // Clear chat input
      setNewQAText('');
    }, [clearLocalMessages, setNewQAText]);

    const containerStyles = useMemo(
      () => ({
        width: standalone ? (isMaximized ? '840px' : '420px') : '100%',
        transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column' as const,
        height: standalone ? 'calc(100vh - 72px)' : '100%',
      }),
      [isMaximized, standalone],
    );

    // Handle window resize and update dimensions
    useEffect(() => {
      const updateDimensions = () => {
        // Calculate available space
        const viewportHeight = window.innerHeight;
        const headerHeight = 52; // Header height
        const launchpadHeight = 180; // Approximate height of launchpad + margins
        const topOffset = 72; // Top offset from viewport

        // Calculate content height
        const availableHeight = viewportHeight - topOffset - headerHeight - launchpadHeight;

        if (messagesWithHistory.length === 0) {
          setContentHeight('auto');
        } else {
          setContentHeight(`${Math.max(300, availableHeight)}px`);
        }
      };

      // Initial calculation
      updateDimensions();

      // Listen for window resize
      window.addEventListener('resize', updateDimensions);

      return () => {
        window.removeEventListener('resize', updateDimensions);
      };
    }, [messagesWithHistory.length]);

    // Scroll to bottom when new messages are added
    useEffect(() => {
      if (messagesContainerRef.current && messagesWithHistory.length > 0) {
        const container = messagesContainerRef.current;
        container.scrollTop = container.scrollHeight; // Scroll to bottom to show newest messages
      }
    }, [messagesWithHistory.length]);

    // Update context when resultId changes or component mounts
    useEffect(() => {
      if (!standalone && resultId) {
        debouncedUpdateContextItems();
      }
    }, [resultId, standalone, debouncedUpdateContextItems]);

    return (
      <div
        className={cn(
          'flex-shrink-0 bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col',
          className,
        )}
        style={containerStyles}
      >
        {standalone && (
          <LinearThreadHeader
            onClose={handleClose}
            onMaximize={handleMaximize}
            isMaximized={isMaximized}
            onClearConversation={handleClearConversation}
          />
        )}
        <LinearThreadContent
          messagesWithHistory={messagesWithHistory}
          messagesContainerRef={messagesContainerRef}
          contentHeight={contentHeight}
        />
        <div className="mt-auto border-t border-gray-200">
          <LaunchPad
            visible={true}
            inReflyPilot={true}
            parentResultId={!standalone && resultId ? resultId : undefined}
            onAddMessage={addLocalMessage}
          />
        </div>
      </div>
    );
  },
);
