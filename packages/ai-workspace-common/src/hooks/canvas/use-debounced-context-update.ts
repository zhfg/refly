import { useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { IContextItem } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { CanvasNodeType } from '@refly/openapi-schema';
import { useReactFlow } from '@xyflow/react';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { useFindThreadHistory } from './use-find-thread-history';

interface UseContextUpdateByEdgesProps {
  readonly: boolean;
  nodeId: string;
  contextItems: IContextItem[];
  updateNodeData: (data: any) => void;
}

interface UseContextUpdateByResultIdProps {
  standalone?: boolean;
  resultId?: string;
  setContextItems: (items: IContextItem[]) => void;
}

/**
 * Hook to update context items based on edges connected to a node
 */
export const useContextUpdateByEdges = ({
  readonly,
  nodeId,
  contextItems,
  updateNodeData,
}: UseContextUpdateByEdgesProps) => {
  const { getNodes, getEdges } = useReactFlow();

  const updateContextItemsByEdges = useCallback(() => {
    if (readonly) return;

    const edges = getEdges();
    const currentEdges = edges?.filter((edge) => edge.target === nodeId) || [];
    if (!currentEdges.length && !contextItems.length) return;

    const nodes = getNodes() as CanvasNode<any>[];

    // get all source nodes that are connected to the current node
    const connectedSourceIds = new Set(currentEdges.map((edge) => edge.source));

    // filter current contextItems, remove nodes that are no longer connected
    const updatedContextItems = contextItems.filter((item) => {
      const itemNode = nodes.find((node) => node.data?.entityId === item.entityId);
      return itemNode && connectedSourceIds.has(itemNode.id);
    });

    // add new connected nodes to contextItems
    for (const edge of currentEdges) {
      const sourceNode = nodes.find((node) => node.id === edge.source);
      if (!sourceNode?.data?.entityId || ['skill', 'group'].includes(sourceNode?.type)) continue;

      const exists = updatedContextItems.some((item) => item.entityId === sourceNode.data.entityId);
      if (!exists) {
        updatedContextItems.push({
          entityId: sourceNode.data.entityId,
          type: sourceNode.type as CanvasNodeType,
          title: sourceNode.data.title || '',
        });
      }
    }

    if (JSON.stringify(updatedContextItems) !== JSON.stringify(contextItems)) {
      updateNodeData({ metadata: { contextItems: updatedContextItems } });
    }
  }, [readonly, nodeId, contextItems, getNodes, getEdges, updateNodeData]);

  const debouncedUpdateContextItems = useDebouncedCallback(() => {
    updateContextItemsByEdges();
  }, 300);

  return { debouncedUpdateContextItems };
};

/**
 * Hook to update context items based on a result ID
 */
export const useContextUpdateByResultId = ({
  resultId,
  setContextItems,
}: UseContextUpdateByResultIdProps) => {
  const { getNodes } = useReactFlow();
  const findThreadHistory = useFindThreadHistory();

  const updateContextItemsFromResultId = useCallback(() => {
    if (!resultId) return;

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
  }, [resultId, getNodes, findThreadHistory, setContextItems]);

  const debouncedUpdateContextItems = useDebouncedCallback(() => {
    updateContextItemsFromResultId();
  }, 300);

  return { debouncedUpdateContextItems };
};
