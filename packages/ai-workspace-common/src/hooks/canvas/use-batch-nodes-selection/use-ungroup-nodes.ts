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
import { shouldDestroyTemporaryGroup, sortNodes } from './utils';

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

      // 检查当前组是否有父组
      const parentGroupId = groupNode.parentId;

      // 计算节点的绝对位置
      const calculateAbsolutePosition = (node: Node, groupNode: Node) => {
        let absoluteX = node.position.x;
        let absoluteY = node.position.y;
        let currentNode = node;
        let currentParent = nodes.find((n) => n.id === currentNode.parentId);

        // 递归计算所有父组的位置偏移
        while (currentParent) {
          absoluteX += currentParent.position.x;
          absoluteY += currentParent.position.y;
          currentNode = currentParent;
          currentParent = nodes.find((n) => n.id === currentNode.parentId);
        }

        return { x: absoluteX, y: absoluteY };
      };

      // 计算相对于父组的位置
      const calculateRelativeToParentPosition = (absolutePosition: { x: number; y: number }, parentGroup: Node) => {
        let parentAbsoluteX = parentGroup.position.x;
        let parentAbsoluteY = parentGroup.position.y;
        let currentParent = nodes.find((n) => n.id === parentGroup.parentId);

        // 递归计算父组的绝对位置
        while (currentParent) {
          parentAbsoluteX += currentParent.position.x;
          parentAbsoluteY += currentParent.position.y;
          currentParent = nodes.find((n) => n.id === currentParent.parentId);
        }

        return {
          x: absolutePosition.x - parentAbsoluteX,
          y: absolutePosition.y - parentAbsoluteY,
        };
      };

      // Update child nodes to remove group parent and restore positions
      const updatedNodes = nodes
        .map((node) => {
          if (node.parentId === groupId) {
            // 计算节点的绝对位置
            const absolutePosition = calculateAbsolutePosition(node, groupNode);

            // Remove group-related properties
            const { parentId, extent, ...nodeWithoutParent } = node;

            // 如果有父组，将节点添加到父组中
            if (parentGroupId) {
              const parentGroup = nodes.find((n) => n.id === parentGroupId);
              if (parentGroup) {
                const relativePosition = calculateRelativeToParentPosition(absolutePosition, parentGroup);
                return {
                  ...nodeWithoutParent,
                  parentId: parentGroupId,
                  extent: 'parent' as const,
                  position: relativePosition,
                  selected: false,
                };
              }
            }

            // 如果没有父组，使用绝对位置
            return {
              ...nodeWithoutParent,
              position: absolutePosition,
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
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];

      // 计算节点的绝对位置
      const calculateAbsolutePosition = (node: Node, nodes: Node[]) => {
        let absoluteX = node.position.x;
        let absoluteY = node.position.y;
        let currentNode = node;
        let currentParent = nodes.find((n) => n.id === currentNode.parentId);

        // 递归计算所有父组的位置偏移
        while (currentParent) {
          absoluteX += currentParent.position.x;
          absoluteY += currentParent.position.y;
          currentNode = currentParent;
          currentParent = nodes.find((n) => n.id === currentNode.parentId);
        }

        return { x: absoluteX, y: absoluteY };
      };

      // Process all groups and their children
      let updatedNodes = [...nodes];

      // Handle each group one by one
      groupIds.forEach((groupId) => {
        const groupNode = updatedNodes.find((n) => n.id === groupId && n.type === 'group');
        if (!groupNode) return;

        // Update child nodes to remove group parent and restore absolute positions
        updatedNodes = updatedNodes
          .map((node) => {
            if (node.parentId === groupId) {
              // 计算节点的绝对位置
              const absolutePosition = calculateAbsolutePosition(node, updatedNodes);

              // Remove group-related properties
              const { parentId, extent, ...nodeWithoutParent } = node;
              return {
                ...nodeWithoutParent,
                // Use absolute position
                position: absolutePosition,
                selected: false,
              };
            }
            return node;
          })
          .filter((node) => node.id !== groupId); // Remove the group node
      });

      updateNodesWithSync(sortNodes(updatedNodes));
    },
    [canvasId, updateNodesWithSync],
  );

  return {
    ungroupNodes,
    ungroupMultipleNodes,
  };
};
