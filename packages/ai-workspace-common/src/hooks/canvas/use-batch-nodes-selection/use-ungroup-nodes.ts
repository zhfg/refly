import { useCallback, useState } from 'react';
import { useCanvasStore, useCanvasStoreShallow } from '../../../stores/canvas';
import { CanvasNode, prepareNodeData } from '../../../components/canvas/nodes';
import { useCanvasData } from '../use-canvas-data';
import { CanvasNodeType } from '@refly/openapi-schema';
import { useCanvasId } from '@refly-packages/ai-workspace-common/hooks/canvas/use-canvas-id';
import { useAddNode } from '../use-add-node';
import { genUniqueId } from '@refly-packages/utils/id';
import { CoordinateExtent, Node } from '@xyflow/react';
import { useNodeOperations } from '@refly-packages/ai-workspace-common/hooks/canvas/use-node-operations';
import { PADDING, shouldDestroyTemporaryGroup, sortNodes } from './utils';

export const useUngroupNodes = () => {
  const canvasId = useCanvasId();
  const { updateNodesWithSync } = useNodeOperations(canvasId);

  const ungroupNodes = useCallback(
    (groupId: string) => {
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];

      // Find the group node
      const groupNode = nodes.find((n) => n.id === groupId && n.type === 'group');
      if (!groupNode) return;

      // Calculate absolute positions for the group
      const getAbsolutePosition = (node: Node) => {
        let absoluteX = node.position.x;
        let absoluteY = node.position.y;
        let currentNode = node;
        let parent = nodes.find((n) => n.id === currentNode.parentId);

        while (parent) {
          absoluteX += parent.position.x;
          absoluteY += parent.position.y;
          currentNode = parent;
          parent = nodes.find((n) => n.id === currentNode.parentId);
        }

        return { x: absoluteX, y: absoluteY };
      };

      const groupAbsolutePos = getAbsolutePosition(groupNode);

      // Update nodes
      const updatedNodes = nodes
        .map((node) => {
          if (node.parentId === groupId) {
            // Calculate absolute position for the child node
            const nodeAbsolutePos = {
              x: groupAbsolutePos.x + node.position.x + PADDING / 2,
              y: groupAbsolutePos.y + node.position.y + PADDING / 2,
            };

            // Remove group-related properties
            const { parentId, extent, ...nodeWithoutParent } = node;

            return {
              ...nodeWithoutParent,
              position: nodeAbsolutePos,
              selected: false,
            };
          }
          return node;
        })
        .filter((node) => node.id !== groupId); // Remove the group node

      updateNodesWithSync(sortNodes(updatedNodes));
    },
    [canvasId, updateNodesWithSync],
  );

  const ungroupMultipleNodes = useCallback(
    (groupIds: string[]) => {
      groupIds.forEach((groupId) => {
        ungroupNodes(groupId);
      });
    },
    [ungroupNodes],
  );

  return {
    ungroupNodes,
    ungroupMultipleNodes,
  };
};
