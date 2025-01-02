import { useCallback } from 'react';
import { applyNodeChanges, NodeChange, Node } from '@xyflow/react';
import { useCanvasData } from './use-canvas-data';
import { useCanvasStore, useCanvasStoreShallow } from '../../stores/canvas';
import { useCanvasSync } from './use-canvas-sync';
import { useContextPanelStore } from '../../stores/context-panel';
import { useCanvasId } from '@refly-packages/ai-workspace-common/hooks/canvas/use-canvas-id';
import { useSelectionMenuPosition } from './use-selection-menu-position';

export const useNodeOperations = (selectedCanvasId?: string) => {
  const canvasId = useCanvasId();
  const { setNodes, setTitle } = useCanvasStoreShallow((state) => ({
    setNodes: state.setNodes,
    setTitle: state.setTitle,
  }));

  const { throttledSyncNodesToYDoc, syncTitleToYDoc } = useCanvasSync();

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

      console.log('mutableNodes', mutableNodes);
      console.log('changes', changes);
      console.log('onNodesChange nodes', nodes);

      // Handle deleted nodes
      const deletedNodes = changes.filter((change) => change.type === 'remove');

      if (deletedNodes.length > 0) {
        const contextStore = useContextPanelStore.getState();

        deletedNodes.forEach((change) => {
          const nodeId = change.id;
          // Remove from context items
          contextStore.removeContextItem(nodeId);
          // Remove from chat history
          contextStore.removeHistoryItem(nodeId);
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
