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
import { useReactFlow } from '@xyflow/react';
import { genUniqueId } from '@refly-packages/utils/id';
import { RefreshCw } from 'lucide-react';
import { useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';
import {
  CanvasNode,
  ResponseNodeMeta,
} from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { useContextPanelStoreShallow } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useDebouncedCallback } from 'use-debounce';
import { CanvasNodeType } from '@refly/openapi-schema';

interface ReflyPilotProps {
  className?: string;
  resultId?: string;
  node?: CanvasNode<ResponseNodeMeta>;
  standalone?: boolean;
  initialMessages?: any[];
  useResultIdMapping?: boolean;
}

const ReflyPilotHeader = memo(
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

export const ReflyPilotContent = memo(
  ({
    messagesWithHistory,
    messagesContainerRef,
    contentHeight,
  }: {
    messagesWithHistory: any[];
    messagesContainerRef: React.RefObject<HTMLDivElement>;
    contentHeight: string | number;
  }) => {
    const sortedMessages = useMemo(() => {
      return [...messagesWithHistory].sort((a, b) => a.timestamp - b.timestamp);
    }, [messagesWithHistory]);

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

export const ReflyPilot = memo(
  ({
    className,
    resultId,
    node,
    standalone = true,
    initialMessages,
    useResultIdMapping = false,
  }: ReflyPilotProps) => {
    const [isMaximized, setIsMaximized] = useState(false);
    const [contentHeight, setContentHeight] = useState('auto');
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const findThreadHistory = useFindThreadHistory();
    const reactFlowInstance = useReactFlow();
    const { getEdges, setEdges, getNodes } = reactFlowInstance;

    const {
      setShowReflyPilot,
      reflyPilotMessages,
      clearReflyPilotMessages,
      addReflyPilotMessage,
      getReflyPilotMessagesByResultId,
      addReflyPilotMessageByResultId,
    } = useCanvasStoreShallow((state) => ({
      setShowReflyPilot: state.setShowReflyPilot,
      reflyPilotMessages: state.reflyPilotMessages,
      clearReflyPilotMessages: state.clearReflyPilotMessages,
      addReflyPilotMessage: state.addReflyPilotMessage,
      getReflyPilotMessagesByResultId: state.getReflyPilotMessagesByResultId,
      addReflyPilotMessageByResultId: state.addReflyPilotMessageByResultId,
    }));

    // Add context panel store to manage context items
    const { setContextItems } = useContextPanelStoreShallow((state) => ({
      setContextItems: state.setContextItems,
    }));

    const { setNewQAText } = useChatStoreShallow((state) => ({
      setNewQAText: state.setNewQAText,
    }));

    // Add function to update context items based on resultId
    const updateContextItemsFromResultId = useCallback(() => {
      if (!resultId || standalone) return;

      // Find the node associated with this resultId
      const nodes = getNodes();
      const currentNode = nodes.find((n) => n.data?.entityId === resultId);

      if (!currentNode) return;

      // Find thread history based on resultId
      const threadHistory = findThreadHistory({ resultId });

      if (threadHistory.length === 0 && !currentNode) return;

      // Get the most recent node in the thread history (or the node itself if history is empty)
      const contextNode =
        threadHistory.length > 0 ? threadHistory[threadHistory.length - 1] : currentNode;

      // Add to context items if it's a valid node
      if (contextNode?.data?.entityId && contextNode.type) {
        setContextItems([
          {
            entityId: String(contextNode.data.entityId),
            // Explicitly cast the type to CanvasNodeType
            type: contextNode.type as CanvasNodeType,
            title: String(contextNode.data.title || ''),
            // Instead of using withHistory, add it to metadata
            metadata: {
              withHistory: true,
            },
          },
        ]);
      }
    }, [resultId, standalone, getNodes, findThreadHistory, setContextItems]);

    // Create a debounced version of the context update function
    const debouncedUpdateContextItems = useDebouncedCallback(() => {
      updateContextItemsFromResultId();
    }, 300);

    // Update context when resultId changes or component mounts
    useEffect(() => {
      if (!standalone && resultId) {
        debouncedUpdateContextItems();
      }
    }, [resultId, standalone, debouncedUpdateContextItems]);

    // Initialize with thread history if resultId is provided
    useEffect(() => {
      if (resultId && node) {
        // If useResultIdMapping is true and initialMessages is not empty, skip initialization
        if (useResultIdMapping && initialMessages && initialMessages.length > 0) {
          return;
        }

        // Find thread history based on resultId
        const threadHistory = findThreadHistory({ resultId });

        // Get existing resultIds in messages for comparison
        const reflyPilotMessages = getReflyPilotMessagesByResultId(resultId);
        const messages =
          useResultIdMapping && reflyPilotMessages?.length > 0
            ? getReflyPilotMessagesByResultId(resultId)
            : reflyPilotMessages;

        const existingResultIds = new Set(messages.map((msg) => msg.resultId));

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
            };

            if (useResultIdMapping) {
              addReflyPilotMessageByResultId(resultId, newMessage);
            } else {
              addReflyPilotMessage(newMessage);
            }

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
          };

          if (useResultIdMapping) {
            addReflyPilotMessageByResultId(resultId, newMessage);
          } else {
            addReflyPilotMessage(newMessage);
          }
        }
      }
    }, [
      resultId,
      node,
      findThreadHistory,
      reflyPilotMessages,
      addReflyPilotMessage,
      useResultIdMapping,
      getReflyPilotMessagesByResultId,
      addReflyPilotMessageByResultId,
      initialMessages,
    ]);

    // Cache thread history for each message
    const messagesWithHistory = useMemo(() => {
      // Use initialMessages if provided (for resultId mapping) and not empty
      const sourceMessages =
        initialMessages && initialMessages.length > 0 && useResultIdMapping
          ? initialMessages
          : useResultIdMapping && resultId
            ? getReflyPilotMessagesByResultId(resultId)
            : reflyPilotMessages;

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
    }, [
      reflyPilotMessages,
      findThreadHistory,
      resultId,
      initialMessages,
      useResultIdMapping,
      getReflyPilotMessagesByResultId,
    ]);

    // Function to automatically connect nodes
    const connectNodes = useCallback(
      (sourceResultId: string, targetResultId: string) => {
        if (!sourceResultId || !targetResultId) return;

        const nodes = reactFlowInstance.getNodes();
        const edges = getEdges();

        // Find source and target nodes by resultId
        const sourceNode = nodes.find((node) => node.data?.entityId === sourceResultId);
        const targetNode = nodes.find((node) => node.data?.entityId === targetResultId);

        if (!sourceNode || !targetNode) return;

        // Check if the edge already exists
        const connectionExists = edges.some(
          (edge) => edge.source === sourceNode.id && edge.target === targetNode.id,
        );

        // If the edge already exists, do not create a new edge
        if (connectionExists) return;

        // Create and add the new edge
        const newEdge = {
          id: `edge-${genUniqueId()}`,
          source: sourceNode.id,
          target: targetNode.id,
          type: 'default',
        };

        setEdges((eds) => [...eds, newEdge]);
      },
      [reactFlowInstance, getEdges, setEdges],
    );

    // Connect node history when messages change
    useEffect(() => {
      // For each message, connect it to its thread history
      for (const message of messagesWithHistory) {
        if (message.threadHistory && message.threadHistory.length > 0) {
          // Get the most recent node in the thread history (last item)
          const mostRecentNode = message.threadHistory[message.threadHistory.length - 1];
          if (mostRecentNode?.data?.entityId) {
            // Connect this node to the Refly Pilot message
            connectNodes(mostRecentNode.data.entityId, message.resultId);
          }
        }
      }
    }, [messagesWithHistory, connectNodes]);

    const handleClose = useCallback(() => {
      setShowReflyPilot(false);
    }, [setShowReflyPilot]);

    const handleMaximize = useCallback(() => {
      setIsMaximized(!isMaximized);
    }, [isMaximized]);

    const handleClearConversation = useCallback(() => {
      // Clear all messages
      clearReflyPilotMessages();
      // Clear chat input
      setNewQAText('');
    }, [clearReflyPilotMessages, setNewQAText]);

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

    return (
      <div
        className={cn(
          'flex-shrink-0 bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col',
          className,
        )}
        style={containerStyles}
      >
        {standalone && (
          <ReflyPilotHeader
            onClose={handleClose}
            onMaximize={handleMaximize}
            isMaximized={isMaximized}
            onClearConversation={handleClearConversation}
          />
        )}
        <ReflyPilotContent
          messagesWithHistory={messagesWithHistory}
          messagesContainerRef={messagesContainerRef}
          contentHeight={contentHeight}
        />
        <div className="mt-auto border-t border-gray-200">
          <LaunchPad
            visible={true}
            inReflyPilot={true}
            parentResultId={!standalone && resultId ? resultId : undefined}
          />
        </div>
      </div>
    );
  },
);
