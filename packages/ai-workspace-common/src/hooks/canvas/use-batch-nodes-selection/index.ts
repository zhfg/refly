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
import {
  calculateGroupBoundaries,
  getValidSelectedNodes,
  PADDING,
  shouldDestroyTemporaryGroup,
  sortNodes,
} from './utils';
import { useUngroupNodes } from './use-ungroup-nodes';

export interface CanvasNodeFilter {
  type: CanvasNodeType;
  entityId: string;
}

export const useBatchNodesSelection = () => {
  const canvasId = useCanvasId();
  const { updateNodesWithSync } = useNodeOperations(canvasId);
  const { ungroupMultipleNodes } = useUngroupNodes();

  const [tempGroupId, setTempGroupId] = useState<string | null>(null);

  const destroyTemporaryGroups = (beforeNodes: CanvasNode<any>[], ungroupMultipleNodes: (ids: string[]) => void) => {
    const tempGroups = beforeNodes.filter((n) => n.type === 'group' && n.data?.metadata?.isTemporary);
    if (tempGroups.length > 0) {
      const groupIds = tempGroups.map((group) => group.id);
      ungroupMultipleNodes(groupIds);
    }
  };

  const shouldUpdateExistingTempGroup = (
    selectedNodes: Node[],
    existingTempGroup: Node | undefined,
    beforeNodes: Node[],
  ) => {
    if (!existingTempGroup) return false;

    const selectedGroups = selectedNodes.filter((node) => node.type === 'group');
    const selectedNonGroups = selectedNodes.filter((node) => node.type !== 'group' && !node.parentId);
    const currentSelectedIds = new Set([...selectedGroups.map((n) => n.id), ...selectedNonGroups.map((n) => n.id)]);
    const beforeGroupChildren = beforeNodes.filter((n) => n.parentId === existingTempGroup.id);
    const beforeChildrenIds = new Set(beforeGroupChildren.map((n) => n.id));

    // Return false if selection hasn't changed
    return !(
      currentSelectedIds.size === beforeChildrenIds.size &&
      [...currentSelectedIds].every((id) => beforeChildrenIds.has(id))
    );
  };

  const shouldCreateNewTempGroup = (selectedNodes: CanvasNode<any>[], beforeNodes: CanvasNode<any>[]) => {
    // Only consider:
    // 1. Non-temporary group nodes themselves
    // 2. Nodes that aren't children of permanent groups
    const validNodes = getValidSelectedNodes(selectedNodes, beforeNodes);

    return validNodes.length >= 2;
  };

  const convertTemporaryToPermGroup = useCallback(
    (tempGroupId: string) => {
      const { data } = useCanvasStore.getState();
      const beforeNodes = data[canvasId]?.nodes ?? [];
      const currentTempGroupNode = beforeNodes.find((n) => n.id === tempGroupId);

      if (!currentTempGroupNode) return;

      // Update the current temporary group to permanent and clear all selections
      const updatedNodes = beforeNodes.map((node) => {
        if (node.id === tempGroupId) {
          // Update the temporary group to permanent
          return {
            ...node,
            data: {
              ...node.data,
              metadata: {
                ...(node.data?.metadata || {}),
                isTemporary: false,
              },
            },
            style: {
              ...node.style,
            },
            selected: false,
            draggable: true,
          };
        }
        // Clear selection for all other nodes
        return {
          ...node,
          selected: false,
        };
      });

      setTempGroupId(null);
      updateNodesWithSync(updatedNodes);
    },
    [canvasId, updateNodesWithSync],
  );

  const createGroupFromSelectedNodes = useCallback(() => {
    const { data } = useCanvasStore.getState();
    const beforeNodes = data[canvasId]?.nodes ?? [];
    const selectedNodes = beforeNodes.filter((n) => n.selected);

    if (selectedNodes.length < 2) return;

    // Update width and height calculation using the same logic
    const { groupNode, minX, minY } = calculateGroupBoundaries(selectedNodes, beforeNodes);

    // Update nodes to be children of the group while maintaining their absolute positions
    const updatedNodes = beforeNodes.map((node) => {
      if (node.selected) {
        return {
          ...node,
          parentId: groupNode.id,
          extent: 'parent' as const,
          // Keep original absolute position
          positionAbsolute: {
            x: node.position.x,
            y: node.position.y,
          },
          // Set relative position within group
          position: {
            x: node.position.x - minX + PADDING / 2,
            y: node.position.y - minY + PADDING / 2,
          },
          selected: false,
          draggable: true,
        };
      }
      return node;
    });

    updateNodesWithSync(sortNodes([...updatedNodes, groupNode]));
  }, [canvasId, updateNodesWithSync, convertTemporaryToPermGroup]);

  const createTemporaryGroup = useCallback(
    (selectedNodes: CanvasNode<any>[]) => {
      if (selectedNodes.length < 2) {
        if (tempGroupId) {
          const { data } = useCanvasStore.getState();
          const beforeNodes = data[canvasId]?.nodes ?? [];
          const existingGroup = beforeNodes.find((n) => n.id === tempGroupId);
          if (!existingGroup) {
            return;
          }

          const updatedNodes = beforeNodes
            .map((node) => {
              if (node.parentId === tempGroupId) {
                const { parentId, extent, ...nodeWithoutParent } = node;
                return {
                  ...nodeWithoutParent,
                  position: {
                    x: node.position.x,
                    y: node.position.y,
                  },
                };
              }
              return node;
            })
            .filter((node) => node.id !== tempGroupId);

          updateNodesWithSync(sortNodes(updatedNodes));
          setTempGroupId(null);
        }
        return;
      }

      const { data } = useCanvasStore.getState();
      const beforeNodes = data[canvasId]?.nodes ?? [];
      const existingGroup = beforeNodes.find((n) => n.type === 'group' && n.data?.metadata?.isTemporary);

      // If there's already a temporary group with the same selected nodes, don't recreate
      if (existingGroup) {
        const beforeGroupChildren = beforeNodes.filter((n) => n.parentId === existingGroup.id);
        const currentSelectedIds = new Set(selectedNodes.map((n) => n.id));
        const beforeChildrenIds = new Set(beforeGroupChildren.map((n) => n.id));

        // Check if the selected nodes are the same as the group children
        if (
          currentSelectedIds.size === beforeChildrenIds.size &&
          [...currentSelectedIds].every((id) => beforeChildrenIds.has(id))
        ) {
          return;
        }
      }

      // Filter out nodes that are children of permanent groups
      const validNodes = getValidSelectedNodes(selectedNodes, beforeNodes);

      if (validNodes.length < 2) {
        return;
      }

      const { groupNode, minX, minY } = calculateGroupBoundaries(validNodes, beforeNodes);

      setTempGroupId(groupNode.id);

      const updatedNodes = beforeNodes.map((node) => {
        if (node.selected) {
          return {
            ...node,
            parentId: groupNode.id,
            extent: 'parent' as const,
            // Keep original absolute position
            positionAbsolute: {
              x: node.position.x,
              y: node.position.y,
            },
            // Set relative position within group
            position: {
              x: node.position.x - minX + 20,
              y: node.position.y - minY + 20,
            },
            selected: true,
            draggable: true,
          };
        }
        return node;
      });

      updateNodesWithSync(sortNodes([...updatedNodes, groupNode]));
    },
    [canvasId, tempGroupId, updateNodesWithSync],
  );

  const updateTempGroup = useCallback(
    (selectedNodes: CanvasNode<any>[], beforeNodes: CanvasNode<any>[], existingTempGroupId: string) => {
      // Filter out nodes that are children of permanent groups
      const validNodes = getValidSelectedNodes(selectedNodes, beforeNodes);

      // 检查是否需要更新
      const currentSelectedIds = new Set(validNodes.map((n) => n.id));
      const beforeGroupChildren = beforeNodes.filter((n) => n.parentId === existingTempGroupId);
      const beforeChildrenIds = new Set(beforeGroupChildren.map((n) => n.id));

      // 如果选中节点和当前组内节点完全相同，则不需要更新
      if (
        currentSelectedIds.size === beforeChildrenIds.size &&
        [...currentSelectedIds].every((id) => beforeChildrenIds.has(id))
      ) {
        return;
      }

      // Calculate positions considering group nodes as whole units
      const nodesToConsider = validNodes.map((node) => {
        if (node.type === 'group') {
          // Use the group's current position and dimensions
          return node;
        }

        // For regular nodes, calculate absolute position if they're in a temporary group
        const existingNode = beforeNodes.find((n) => n.id === node.id);
        if (!existingNode) return node;

        // If node was already in group, calculate its absolute position
        if (existingNode.parentId === existingTempGroupId) {
          const parentGroup = beforeNodes.find((n) => n.id === existingTempGroupId);
          return {
            ...node,
            position: {
              x: parentGroup.position.x + existingNode.position.x,
              y: parentGroup.position.y + existingNode.position.y,
            },
          };
        }

        return node;
      });

      // Calculate new boundaries based on absolute positions
      const { minX, minY, dimensions } = calculateGroupBoundaries(nodesToConsider, beforeNodes);

      // Update nodes while maintaining absolute positions
      const updatedNodes = beforeNodes.map((node) => {
        if (node.id === existingTempGroupId) {
          // Update group position and size
          return {
            ...node,
            position: {
              x: minX - PADDING / 2,
              y: minY - PADDING / 2,
            },
            style: {
              ...node.style,
              width: dimensions.width,
              height: dimensions.height,
            },
            data: {
              ...node.data,
              metadata: {
                ...(node.data?.metadata || {}),
                width: dimensions.width,
                height: dimensions.height,
              },
            },
          };
        }

        const isSelected = validNodes.some((n) => n.id === node.id);
        if (isSelected) {
          const absolutePosition =
            node.parentId === existingTempGroupId
              ? {
                  x: node.positionAbsolute?.x || node.position.x,
                  y: node.positionAbsolute?.y || node.position.y,
                }
              : node.position;

          return {
            ...node,
            parentId: existingTempGroupId,
            extent: 'parent' as const,
            positionAbsolute: absolutePosition,
            position: {
              x: absolutePosition.x - minX + PADDING / 2,
              y: absolutePosition.y - minY + PADDING / 2,
            },
            selected: true,
            draggable: true,
          };
        }

        // Remove nodes from group that are no longer selected
        if (node.parentId === existingTempGroupId && !isSelected) {
          const absolutePosition = {
            x:
              node.positionAbsolute?.x ||
              node.position.x + beforeNodes.find((n) => n.id === existingTempGroupId)?.position.x,
            y:
              node.positionAbsolute?.y ||
              node.position.y + beforeNodes.find((n) => n.id === existingTempGroupId)?.position.y,
          };

          const { parentId, extent, ...nodeWithoutParent } = node;
          return {
            ...nodeWithoutParent,
            position: absolutePosition,
            selected: false,
          };
        }

        return node;
      });

      updateNodesWithSync(sortNodes(updatedNodes));
    },
    [updateNodesWithSync],
  );

  const handleSelectionChange = useCallback(
    (selectedNodes: CanvasNode<any>[] = []) => {
      const { data } = useCanvasStore.getState();
      const beforeNodes = data[canvasId]?.nodes ?? [];

      // Filter out nodes that are children of permanent groups
      const validNodes = getValidSelectedNodes(selectedNodes, beforeNodes);

      console.log('validNodes', validNodes, selectedNodes, beforeNodes);

      // Step 1: Handle case when 1 or fewer valid nodes are selected
      if (validNodes.length <= 1) {
        destroyTemporaryGroups(beforeNodes, ungroupMultipleNodes);
        return;
      }

      // Step 2: Check for existing temporary group
      const existingTempGroup = beforeNodes.find((n) => n.type === 'group' && n.data?.metadata?.isTemporary);

      // Step 3: Update existing temporary group if needed
      if (existingTempGroup && shouldUpdateExistingTempGroup(selectedNodes, existingTempGroup, beforeNodes)) {
        updateTempGroup(selectedNodes, beforeNodes, existingTempGroup.id);
        return;
      }

      // Step 4: Create new temporary group if needed
      if (shouldCreateNewTempGroup(selectedNodes, beforeNodes)) {
        createTemporaryGroup(selectedNodes);
      }
    },
    [canvasId, updateNodesWithSync, ungroupMultipleNodes],
  );

  return {
    handleSelectionChange,
    createGroupFromSelectedNodes,
    createTemporaryGroup,
    tempGroupId,
    convertTemporaryToPermGroup,
  };
};
