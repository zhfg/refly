import { useCallback } from 'react';
import { Node, useReactFlow } from '@xyflow/react';
import { useCanvasStore } from '../../stores/canvas';
import { useGroupNodes } from './use-batch-nodes-selection/use-group-nodes';
import { useNodePosition } from './use-node-position';
import { useNodeOperations } from './use-node-operations';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';

export const useNodeCluster = () => {
  const { canvasId } = useCanvasContext();
  const { getNode } = useReactFlow();
  const { createGroupFromSelectedNodes } = useGroupNodes();
  const { layoutBranchAndUpdatePositions } = useNodePosition();
  const { updateNodesWithSync } = useNodeOperations();

  // Helper function to get all target nodes recursively
  const getTargetNodesCluster = useCallback((canvasId: string, nodeId: string): Node[] => {
    const { data } = useCanvasStore.getState();
    const nodes = data[canvasId]?.nodes ?? [];
    const edges = data[canvasId]?.edges ?? [];
    const visited = new Set<string>();
    const cluster: Node[] = [];

    const traverse = (currentId: string) => {
      if (visited.has(currentId)) return;
      visited.add(currentId);

      const node = nodes.find((n) => n.id === currentId);
      if (node) {
        cluster.push(node);
        // Find all target nodes
        edges.filter((edge) => edge.source === currentId).forEach((edge) => traverse(edge.target));
      }
    };

    traverse(nodeId);
    return cluster;
  }, []);

  // Select all target nodes in the cluster
  const selectNodeCluster = useCallback(
    (nodeId: string) => {
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];
      const cluster = getTargetNodesCluster(canvasId, nodeId);

      const updatedNodes = nodes.map((node) => ({
        ...node,
        selected: cluster.some((n) => n.id === node.id),
      }));

      updateNodesWithSync(updatedNodes);
    },
    [getTargetNodesCluster, updateNodesWithSync, canvasId],
  );

  // Create a group from the node cluster
  const groupNodeCluster = useCallback(
    (nodeId: string) => {
      // First select all nodes in the cluster
      selectNodeCluster(nodeId);
      // Then create a group from the selected nodes
      createGroupFromSelectedNodes();
    },
    [selectNodeCluster, createGroupFromSelectedNodes],
  );

  // Layout the node cluster
  const layoutNodeCluster = useCallback(
    (nodeId: string) => {
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];
      const edges = data[canvasId]?.edges ?? [];

      layoutBranchAndUpdatePositions(
        [nodeId],
        nodes,
        edges,
        { fromRoot: true },
        { targetNodeId: nodeId, needSetCenter: true },
      );
    },
    [layoutBranchAndUpdatePositions, canvasId],
  );

  return {
    selectNodeCluster,
    groupNodeCluster,
    layoutNodeCluster,
  };
};
