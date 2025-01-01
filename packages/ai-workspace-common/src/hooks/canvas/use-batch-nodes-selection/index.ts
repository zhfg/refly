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
import { calculateGroupBoundaries, PADDING, shouldDestroyTemporaryGroup, sortNodes } from './utils';
import { useUngroupNodes } from './use-ungroup-nodes';

export interface CanvasNodeFilter {
  type: CanvasNodeType;
  entityId: string;
}

export const useBatchNodesSelection = () => {
  const canvasId = useCanvasId();
  const { updateNodesWithSync } = useNodeOperations(canvasId);
  const { ungroupMultipleNodes } = useUngroupNodes();
  // ungroup

  const [tempGroupId, setTempGroupId] = useState<string | null>(null);

  const destroyTemporaryGroups = (nodes: CanvasNode<any>[], ungroupMultipleNodes: (ids: string[]) => void) => {
    const tempGroups = nodes.filter((n) => n.type === 'group' && n.data?.metadata?.isTemporary);
    if (tempGroups.length > 0) {
      const groupIds = tempGroups.map((group) => group.id);
      ungroupMultipleNodes(groupIds);
    }
  };

  const shouldUpdateExistingTempGroup = (
    selectedNodes: Node[],
    existingTempGroup: Node | undefined,
    currentNodes: Node[],
  ) => {
    if (!existingTempGroup) return false;

    const selectedGroups = selectedNodes.filter((node) => node.type === 'group');
    const selectedNonGroups = selectedNodes.filter((node) => node.type !== 'group' && !node.parentId);
    const currentSelectedIds = new Set([...selectedGroups.map((n) => n.id), ...selectedNonGroups.map((n) => n.id)]);
    const currentGroupChildren = currentNodes.filter((n) => n.parentId === existingTempGroup.id);
    const currentChildrenIds = new Set(currentGroupChildren.map((n) => n.id));

    // Return false if selection hasn't changed
    return !(
      currentSelectedIds.size === currentChildrenIds.size &&
      [...currentSelectedIds].every((id) => currentChildrenIds.has(id))
    );
  };

  const shouldCreateNewTempGroup = (selectedNodes: Node[]) => {
    const selectedGroups = selectedNodes.filter((node) => node.type === 'group');
    const selectedNonGroups = selectedNodes.filter((node) => node.type !== 'group' && !node.parentId);

    // Don't create group if only group nodes are selected
    if (selectedGroups.length > 0 && selectedNonGroups.length === 0) {
      return false;
    }

    return selectedNodes.length >= 2;
  };

  const convertTemporaryToPermGroup = useCallback(
    (groupId: string) => {
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];
      const currentNode = nodes.find((n) => n.id === groupId);

      if (!currentNode) return;

      // Update the current temporary group to permanent and clear all selections
      const updatedNodes = nodes.map((node) => {
        if (node.id === groupId) {
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
    const nodes = data[canvasId]?.nodes ?? [];
    const selectedNodes = nodes.filter((node) => node.selected);

    if (selectedNodes.length < 2) return;

    // Check if there's already a temporary group
    const tempGroup = nodes.find((n) => n.type === 'group' && n.data?.metadata?.isTemporary);
    if (tempGroup) {
      // If there's a temporary group, convert it to permanent
      convertTemporaryToPermGroup(tempGroup.id);
      return;
    }

    // Update width and height calculation using the same logic
    const { groupNode, minX, minY } = calculateGroupBoundaries(selectedNodes, nodes);

    // Update nodes to be children of the group while maintaining their absolute positions
    const updatedNodes = nodes.map((node) => {
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
    (selectedNodes: Node[]) => {
      if (selectedNodes.length < 2) {
        if (tempGroupId) {
          const { data } = useCanvasStore.getState();
          const nodes = data[canvasId]?.nodes ?? [];
          const existingGroup = nodes.find((n) => n.id === tempGroupId);
          if (!existingGroup) {
            return;
          }

          const updatedNodes = nodes
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
      const nodes = data[canvasId]?.nodes ?? [];
      const existingGroup = nodes.find((n) => n.type === 'group' && n.data?.metadata?.isTemporary);

      // If there's already a temporary group with the same selected nodes, don't recreate
      if (existingGroup) {
        const groupChildren = nodes.filter((n) => n.parentId === existingGroup.id);
        const selectedIds = new Set(selectedNodes.map((n) => n.id));
        const childrenIds = new Set(groupChildren.map((n) => n.id));

        // Check if the selected nodes are the same as the group children
        if (selectedIds.size === childrenIds.size && [...selectedIds].every((id) => childrenIds.has(id))) {
          return;
        }
      }

      const { groupNode, minX, minY } = calculateGroupBoundaries(selectedNodes, nodes);

      setTempGroupId(groupNode.id);

      const updatedNodes = nodes.map((node) => {
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
    (selectedNodes: Node[], currentNodes: Node[], existingGroupId: string) => {
      // 检查是否需要更新
      const currentSelectedIds = new Set(selectedNodes.filter((n) => n.type !== 'group').map((n) => n.id));
      const currentGroupChildren = currentNodes.filter((n) => n.parentId === existingGroupId && n.type !== 'group');
      const currentChildrenIds = new Set(currentGroupChildren.map((n) => n.id));

      // 如果选中节点和当前组内节点完全相同，则不需要更新
      if (
        currentSelectedIds.size === currentChildrenIds.size &&
        [...currentSelectedIds].every((id) => currentChildrenIds.has(id))
      ) {
        return;
      }

      console.log('updateTempGroup', selectedNodes, currentGroupChildren, existingGroupId);

      // Find existing group node
      const existingGroup = currentNodes.find((n) => n.id === existingGroupId);
      if (!existingGroup) return;

      // Calculate new boundaries for all selected nodes
      const { minX, minY, dimensions } = calculateGroupBoundaries(selectedNodes, currentNodes);
      const { width, height } = dimensions;

      // Update existing group node and its children
      const updatedNodes = currentNodes.map((node) => {
        if (node.id === existingGroupId) {
          return {
            ...node,
            position: {
              x: minX - PADDING / 2,
              y: minY - PADDING / 2,
            },
            style: {
              ...node.style,
              width,
              height,
            },
            data: {
              ...node.data,
              metadata: {
                ...((node.data?.metadata as any) || {}),
                width,
                height,
              },
            },
          };
        }

        const isSelected = currentSelectedIds.has(node.id);
        if (isSelected) {
          // Calculate relative position based on whether the node was already in the group
          const nodeAbsolutePosition =
            node.parentId === existingGroupId
              ? {
                  x: existingGroup.position.x + node.position.x,
                  y: existingGroup.position.y + node.position.y,
                }
              : node.position;

          return {
            ...node,
            parentId: existingGroupId,
            extent: 'parent' as const,
            positionAbsolute: nodeAbsolutePosition,
            position: {
              x: nodeAbsolutePosition.x - minX + PADDING / 2,
              y: nodeAbsolutePosition.y - minY + PADDING / 2,
            },
            selected: true,
            draggable: true,
          };
        }

        // Remove parentId for nodes that are no longer selected
        if (node.parentId === existingGroupId && !isSelected) {
          const { parentId, extent, ...nodeWithoutParent } = node;
          return {
            ...nodeWithoutParent,
            position: {
              x: node.position.x + existingGroup.position.x,
              y: node.position.y + existingGroup.position.y,
            },
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
      const currentNodes = data[canvasId]?.nodes ?? [];

      // Step 1: Handle case when 1 or fewer nodes are selected
      if (shouldDestroyTemporaryGroup(selectedNodes)) {
        destroyTemporaryGroups(currentNodes, ungroupMultipleNodes);
        return;
      }

      // Step 2: Check for existing temporary group
      const existingTempGroup = currentNodes.find((n) => n.type === 'group' && n.data?.metadata?.isTemporary);

      // Step 3: Update existing temporary group if needed
      if (existingTempGroup && shouldUpdateExistingTempGroup(selectedNodes, existingTempGroup, currentNodes)) {
        updateTempGroup(selectedNodes, currentNodes, existingTempGroup?.id);
        return;
      }

      // Step 4: Create new temporary group if needed
      if (shouldCreateNewTempGroup(selectedNodes)) {
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
