import { memo, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  CanvasNode,
  ResponseNodeMeta,
} from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { LinearThreadContent } from '@refly-packages/ai-workspace-common/components/canvas/refly-pilot/linear-thread';
import { LinearThreadMessage } from '@refly-packages/ai-workspace-common/stores/canvas';
import { cn } from '@refly-packages/utils/cn';
import { useFindThreadHistory } from '@refly-packages/ai-workspace-common/hooks/canvas/use-find-thread-history';
import { genActionResultID, genUniqueId } from '@refly-packages/utils/id';
import { ChatPanel } from '@refly-packages/ai-workspace-common/components/canvas/node-chat-panel';
import { IContextItem } from '@refly-packages/ai-workspace-common/stores/context-panel';
import {
  ModelInfo,
  Skill,
  SkillRuntimeConfig,
  SkillTemplateConfig,
  ActionStatus,
} from '@refly/openapi-schema';
import { useInvokeAction } from '@refly-packages/ai-workspace-common/hooks/canvas/use-invoke-action';
import { useFindSkill } from '@refly-packages/ai-workspace-common/hooks/use-find-skill';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';
import { convertContextItemsToNodeFilters } from '@refly-packages/ai-workspace-common/utils/map-context-items';
import { useAddNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-add-node';
import { useContextUpdateByResultId } from '@refly-packages/ai-workspace-common/hooks/canvas/use-debounced-context-update';
import { useReactFlow } from '@xyflow/react';

interface EnhancedSkillResponseProps {
  node: CanvasNode<ResponseNodeMeta>;
  resultId: string;
  className?: string;
}

export const EnhancedSkillResponse = memo(
  ({ node, resultId, className }: EnhancedSkillResponseProps) => {
    // Thread messages state
    const [messages, setMessages] = useState<LinearThreadMessage[]>([]);
    const findThreadHistory = useFindThreadHistory();
    const { getNodes, getEdges } = useReactFlow();

    // Local state for ChatPanel
    const [query, setQuery] = useState('');
    const [selectedSkillName, setSelectedSkillName] = useState<string | undefined>();
    const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
    const [contextItems, setContextItems] = useState<IContextItem[]>([]);
    const [runtimeConfig, setRuntimeConfig] = useState<SkillRuntimeConfig>({});
    const [tplConfig, setTplConfig] = useState<SkillTemplateConfig | undefined>();

    // Extract the last message resultId for context updates
    const lastMessageResultId = useMemo(() => {
      const lastMessage = messages?.[messages.length - 1];
      return lastMessage?.resultId;
    }, [messages]);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const retryTimeoutRef = useRef<NodeJS.Timeout>();
    const contentHeight = useMemo(
      () => (messages.length === 0 ? 'auto' : '300px'),
      [messages.length],
    );

    // Hooks
    const selectedSkill = useFindSkill(selectedSkillName);
    const { invokeAction, abortAction } = useInvokeAction();
    const { canvasId, readonly } = useCanvasContext();
    const { addNode } = useAddNode();

    const { debouncedUpdateContextItems } = useContextUpdateByResultId({
      resultId: lastMessageResultId ?? resultId,
      setContextItems,
    });

    // Initialize messages from resultId and its thread history with retry mechanism
    useEffect(() => {
      const initializeMessages = () => {
        if (resultId && node) {
          const nodes = getNodes();
          const edges = getEdges();

          // Check if we have enough data loaded
          if (nodes.length === 0 || edges.length === 0) {
            // Clear any existing timeout
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
            }
            // Retry after a delay
            retryTimeoutRef.current = setTimeout(initializeMessages, 500);
            return;
          }

          // Find thread history based on resultId
          const threadHistory = findThreadHistory({ resultId });

          // Initialize with empty messages array
          const initialMessages: LinearThreadMessage[] = [];

          // Check if current node is already in thread history to avoid duplication
          const isNodeInHistory = threadHistory.some((historyNode) => historyNode.id === node.id);

          // Add all history nodes to messages (and current node only if not already in history)
          const allNodes = isNodeInHistory ? threadHistory : [...threadHistory, node];

          allNodes.forEach((historyNode, index) => {
            const nodeResultId = historyNode?.data?.entityId;
            if (nodeResultId) {
              initialMessages.push({
                id: `history-${historyNode.id}-${index}`,
                resultId: nodeResultId,
                nodeId: historyNode.id,
                timestamp: Date.now() - (allNodes.length - index) * 1000, // Ensure proper ordering
                data: historyNode.data,
              });
            }
          });

          setMessages(initialMessages);

          // Initialize ChatPanel state from node data if available
          if (node?.data?.metadata) {
            const metadata = node.data.metadata as any;
            if (metadata.selectedSkill?.name) setSelectedSkillName(metadata.selectedSkill.name);
            if (metadata.modelInfo) setModelInfo(metadata.modelInfo);
            if (metadata.tplConfig) setTplConfig(metadata.tplConfig);
            if (metadata.runtimeConfig) setRuntimeConfig(metadata.runtimeConfig);
          }

          debouncedUpdateContextItems();
        }
      };

      initializeMessages();

      // Cleanup
      return () => {
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
      };
    }, [resultId, node, getNodes, getEdges, findThreadHistory, debouncedUpdateContextItems]);

    // Scroll to bottom effect
    useEffect(() => {
      if (containerRef.current && messages.length > 0) {
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        }, 100);
      }
    }, [messages]);

    // Update context when lastMessageResultId changes
    useEffect(() => {
      if (lastMessageResultId) {
        debouncedUpdateContextItems();
      }
    }, [lastMessageResultId, debouncedUpdateContextItems]);

    // Handler for image upload - memoized to prevent recreation on each render
    const handleImageUpload = useCallback(async (file: File) => {
      // Mock implementation - in a real app, this would upload the image and return data
      const mockImageData = {
        entityId: genUniqueId(),
        type: 'image',
        title: file.name,
        url: URL.createObjectURL(file),
        name: file.name,
      };

      setContextItems((prev) => [...prev, mockImageData as IContextItem]);

      return mockImageData;
    }, []);

    // Handler for send message - memoized for stability
    const handleSendMessage = useCallback(() => {
      if (!canvasId || !query.trim()) return;

      // Store current query for later use
      const currentQuery = query;

      // Clear the input query immediately
      setQuery('');

      // Generate IDs for the new skill response
      const newResultId = genActionResultID();
      const newNodeId = genUniqueId();

      // Create message object for the thread
      const newMessage: LinearThreadMessage = {
        id: `message-${newNodeId}`,
        resultId: newResultId,
        nodeId: newNodeId,
        timestamp: Date.now(),
        data: {
          title: currentQuery,
          entityId: newResultId,
          metadata: {
            status: 'executing' as ActionStatus,
            contextItems,
            tplConfig,
            selectedSkill,
            modelInfo,
            runtimeConfig,
            structuredData: {
              query: currentQuery,
            },
          } as ResponseNodeMeta,
        },
      };

      // Add this message to the thread
      setMessages((prev) => [...prev, newMessage]);

      // Invoke the action with all necessary parameters
      invokeAction(
        {
          resultId: newResultId,
          query: currentQuery,
          selectedSkill,
          modelInfo,
          contextItems,
          tplConfig,
          runtimeConfig,
        },
        {
          entityId: canvasId,
          entityType: 'canvas',
        },
      );

      // Create a node to display the response
      addNode(
        {
          type: 'skillResponse',
          data: {
            title: currentQuery,
            entityId: newResultId,
            metadata: {
              status: 'executing' as ActionStatus,
              contextItems,
              tplConfig,
              selectedSkill,
              modelInfo,
              runtimeConfig,
              structuredData: {
                query: currentQuery,
              },
            } as ResponseNodeMeta,
          },
        },
        convertContextItemsToNodeFilters(contextItems),
        false,
        true,
      );
    }, [
      query,
      selectedSkill,
      modelInfo,
      contextItems,
      tplConfig,
      runtimeConfig,
      canvasId,
      invokeAction,
      addNode,
    ]);

    // Handler for setting selected skill - memoized to ensure referential stability
    const handleSetSelectedSkill = useCallback((skill: Skill | null) => {
      setSelectedSkillName(skill?.name);
    }, []);

    // Memoized query setter to prevent unnecessary re-renders
    const handleSetQuery = useCallback((newQuery: string) => {
      setQuery(newQuery);
    }, []);

    // Memoize the ChatPanel component to prevent unnecessary re-renders
    const chatPanelComponent = useMemo(
      () => (
        <ChatPanel
          mode="list"
          readonly={readonly}
          query={query}
          setQuery={handleSetQuery}
          selectedSkill={selectedSkill}
          setSelectedSkill={handleSetSelectedSkill}
          contextItems={contextItems}
          setContextItems={setContextItems}
          modelInfo={modelInfo}
          setModelInfo={setModelInfo}
          runtimeConfig={runtimeConfig}
          setRuntimeConfig={setRuntimeConfig}
          tplConfig={tplConfig}
          setTplConfig={(config) => {
            setTplConfig(config);
            console.log('tplConfig', config);
          }}
          handleSendMessage={handleSendMessage}
          handleAbortAction={abortAction}
          handleUploadImage={handleImageUpload}
          onInputHeightChange={() => {
            // Adjust container height if needed
          }}
          className="w-full"
        />
      ),
      [
        readonly,
        query,
        handleSetQuery,
        selectedSkill,
        handleSetSelectedSkill,
        contextItems,
        setContextItems,
        modelInfo,
        setModelInfo,
        runtimeConfig,
        setRuntimeConfig,
        tplConfig,
        setTplConfig,
        handleSendMessage,
        abortAction,
        handleImageUpload,
      ],
    );

    // Memoize the LinearThreadContent component
    const threadContentComponent = useMemo(
      () => <LinearThreadContent messages={messages} contentHeight={contentHeight} />,
      [messages, contentHeight],
    );

    return (
      <div ref={containerRef} className={cn('flex flex-col h-full w-full', className)}>
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-col w-full">
            {threadContentComponent}
            {chatPanelComponent}
          </div>
        </div>
      </div>
    );
  },
);

EnhancedSkillResponse.displayName = 'EnhancedSkillResponse';
