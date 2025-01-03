import { useCallback } from 'react';
import { applyNodeChanges, NodeChange } from '@xyflow/react';
import { useCanvasStore, useCanvasStoreShallow } from '../../stores/canvas';
import { useCanvasSync } from './use-canvas-sync';
import { useContextPanelStoreShallow } from '../../stores/context-panel';
import { useCanvasId } from '@refly-packages/ai-workspace-common/hooks/canvas/use-canvas-id';

export const useNodeOperations = () => {
  const canvasId = useCanvasId();
  const { setNodes, removeNodePreview } = useCanvasStoreShallow((state) => ({
    setNodes: state.setNodes,
    removeNodePreview: state.removeNodePreview,
  }));
  const { removeContextItem } = useContextPanelStoreShallow((state) => ({
    removeContextItem: state.removeContextItem,
  }));

  const { throttledSyncNodesToYDoc } = useCanvasSync();

  const updateNodesWithSync = useCallback(
    (updatedNodes: any[]) => {
      setNodes(canvasId, updatedNodes);
      throttledSyncNodesToYDoc(updatedNodes);
    },
    [canvasId, setNodes, throttledSyncNodesToYDoc],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<any>[]) => {
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];

      const mutableNodes = nodes.map((node) => ({
        ...node,
        measured: node.measured ? { ...node.measured } : undefined,
      }));

      // Handle deleted nodes
      const deletedNodes = changes.filter((change) => change.type === 'remove');

      if (deletedNodes.length > 0) {
        deletedNodes.forEach((change) => {
          const nodeId = change.id;
          // Remove from context items and node previews
          removeContextItem(nodeId);
          removeNodePreview(canvasId, nodeId);
        });
      }

      const updatedNodes = applyNodeChanges(changes, mutableNodes);
      updateNodesWithSync(updatedNodes);

      return updatedNodes;
    },
    [canvasId, updateNodesWithSync],
  );

  return {
    onNodesChange,
    updateNodesWithSync,
  };
};
