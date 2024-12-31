import { useCallback, useState } from 'react';
import { useCanvasStore, useCanvasStoreShallow } from '../../stores/canvas';
import { CanvasNode, prepareNodeData } from '../../components/canvas/nodes';
import { useCanvasData } from './use-canvas-data';
import { CanvasNodeType } from '@refly/openapi-schema';
import { useCanvasId } from '@refly-packages/ai-workspace-common/hooks/canvas/use-canvas-id';
import { useAddNode } from './use-add-node';
import { genUniqueId } from '@refly-packages/utils/id';
import { CoordinateExtent, Node } from '@xyflow/react';
import { useNodeOperations } from '@refly-packages/ai-workspace-common/hooks/canvas/use-node-operations';

export interface CanvasNodeFilter {
  type: CanvasNodeType;
  entityId: string;
}

export const useNodeSelection = () => {
  const canvasId = useCanvasId();

  const { setNodes } = useCanvasStoreShallow((state) => ({
    setNodes: state.setNodes,
  }));
  const { updateNodesWithSync } = useNodeOperations(canvasId);

  const [tempGroupId, setTempGroupId] = useState<string | null>(null);

  const ungroupNodes = useCallback(
    (groupId: string) => {
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];

      // Find the group node
      const groupNode = nodes.find((n) => n.id === groupId && n.type === 'group');
      if (!groupNode) return;

      // Update child nodes to remove group parent and restore absolute positions
      const updatedNodes = nodes
        .map((node) => {
          if (node.parentId === groupId) {
            // Remove group-related properties
            const { parentId, extent, ...nodeWithoutParent } = node;
            return {
              ...nodeWithoutParent,
              // Restore absolute position
              position: {
                x: groupNode.position.x + node.position.x,
                y: groupNode.position.y + node.position.y,
              },
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
              // Remove group-related properties
              const { parentId, extent, ...nodeWithoutParent } = node;
              return {
                ...nodeWithoutParent,
                // Restore absolute position
                position: {
                  x: groupNode.position.x + node.position.x,
                  y: groupNode.position.y + node.position.y,
                },
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

  const setSelectedNode = useCallback(
    (node: CanvasNode<any> | null) => {
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];
      const updatedNodes = nodes.map((n) => ({
        ...n,
        selected: n.id === node?.id,
      }));
      setNodes(canvasId, updatedNodes);
    },
    [canvasId, setNodes],
  );

  const addSelectedNode = useCallback(
    (node: CanvasNode<any> | null) => {
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];
      const updatedNodes = nodes.map((n) => ({
        ...n,
        selected: n.id === node?.id ? true : n.selected,
      }));
      setNodes(canvasId, updatedNodes);
    },
    [canvasId, setNodes],
  );

  const setSelectedNodeByEntity = useCallback(
    (filter: CanvasNodeFilter) => {
      const { type, entityId } = filter;
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];
      const node = nodes.find((node) => node.type === type && node.data?.entityId === entityId);
      if (node) {
        setSelectedNode(node);
      }
    },
    [canvasId, setSelectedNode],
  );

  const addSelectedNodeByEntity = useCallback(
    (filter: CanvasNodeFilter) => {
      const { type, entityId } = filter;
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];
      const node = nodes.find((node) => node.type === type && node.data?.entityId === entityId);
      if (node) {
        addSelectedNode(node);
      }
    },
    [canvasId, addSelectedNode],
  );

  const sortNodes = (nodes: Node[]) => {
    return nodes.sort((a, b) => {
      if (a.type === 'group') return -1;
      if (b.type === 'group') return 1;
      return 0;
    });
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
    const getNodeDimensions = (node: Node) => {
      const width = node.measured?.width ?? node.width ?? 200;
      const height = node.measured?.height ?? node.height ?? 100;
      return { width, height };
    };

    const nodeBoundaries = selectedNodes.map((node) => {
      const { width, height } = getNodeDimensions(node);
      return {
        left: node.position.x,
        right: node.position.x + width,
        top: node.position.y,
        bottom: node.position.y + height,
      };
    });

    const minX = Math.min(...nodeBoundaries.map((b) => b.left));
    const maxX = Math.max(...nodeBoundaries.map((b) => b.right));
    const minY = Math.min(...nodeBoundaries.map((b) => b.top));
    const maxY = Math.max(...nodeBoundaries.map((b) => b.bottom));

    const PADDING = 40;
    const width = maxX - minX + PADDING;
    const height = maxY - minY + PADDING;

    const groupNode = prepareNodeData({
      type: 'group' as CanvasNodeType,
      data: {
        title: 'Group',
        entityId: genUniqueId(),
        metadata: {
          width,
          height,
          isTemporary: false,
        },
      },
      position: {
        x: minX - PADDING / 2,
        y: minY - PADDING / 2,
      },
      selected: false,
      className: 'react-flow__node-default important-box-shadow-none',
      style: {
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        width: width,
        height: height,
      },
    });

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
            x: node.position.x - minX + 20,
            y: node.position.y - minY + 20,
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

      // Update width and height calculation
      const getNodeDimensions = (node: Node) => {
        // Get node width and height, either from measured dimensions or default values
        const width = node.measured?.width ?? node.width ?? 200;
        const height = node.measured?.height ?? node.height ?? 100;
        return { width, height };
      };

      // Calculate group boundaries including node dimensions
      const nodeBoundaries = selectedNodes.map((node) => {
        const { width, height } = getNodeDimensions(node);
        return {
          left: node.position.x,
          right: node.position.x + width,
          top: node.position.y,
          bottom: node.position.y + height,
        };
      });

      const minX = Math.min(...nodeBoundaries.map((b) => b.left));
      const maxX = Math.max(...nodeBoundaries.map((b) => b.right));
      const minY = Math.min(...nodeBoundaries.map((b) => b.top));
      const maxY = Math.max(...nodeBoundaries.map((b) => b.bottom));

      // Add padding to the group dimensions
      const PADDING = 40; // 20px padding on each side
      const width = maxX - minX + PADDING;
      const height = maxY - minY + PADDING;

      const groupNode = prepareNodeData({
        type: 'group' as CanvasNodeType,
        data: {
          title: 'Group',
          entityId: genUniqueId(),
          metadata: {
            width,
            height,
            isTemporary: true,
          },
        },
        position: {
          x: minX - PADDING / 2,
          y: minY - PADDING / 2,
        },
        selected: false,
        className: 'react-flow__node-default important-box-shadow-none',
        style: {
          background: 'transparent',
          border: 'none', // No border for temporary group
          boxShadow: 'none',
          width: width,
          height: height,
        },
      });

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

      // Get node dimensions helper
      const getNodeDimensions = (node: Node) => {
        const width = node.measured?.width ?? node.width ?? 200;
        const height = node.measured?.height ?? node.height ?? 100;
        return { width, height };
      };

      // Find existing group node
      const existingGroup = currentNodes.find((n) => n.id === existingGroupId);
      if (!existingGroup) return;

      // Calculate new boundaries for all selected nodes
      const nodeBoundaries = selectedNodes.map((node) => {
        const { width, height } = getNodeDimensions(node);
        // If node is already in group, use its absolute position
        const nodePosition =
          node.parentId === existingGroupId
            ? {
                x: existingGroup.position.x + node.position.x,
                y: existingGroup.position.y + node.position.y,
              }
            : node.position;

        return {
          left: nodePosition.x,
          right: nodePosition.x + width,
          top: nodePosition.y,
          bottom: nodePosition.y + height,
        };
      });

      const minX = Math.min(...nodeBoundaries.map((b) => b.left));
      const maxX = Math.max(...nodeBoundaries.map((b) => b.right));
      const minY = Math.min(...nodeBoundaries.map((b) => b.top));
      const maxY = Math.max(...nodeBoundaries.map((b) => b.bottom));

      const PADDING = 40;
      const width = maxX - minX + PADDING;
      const height = maxY - minY + PADDING;

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

  const setSelectedNodes = useCallback(
    (selectedNodes: CanvasNode<any>[], currentNodes: CanvasNode<any>[]) => {
      // Find all temporary groups
      const tempGroups = currentNodes.filter((n) => n.type === 'group' && n.data?.metadata?.isTemporary);

      // If there are multiple temp groups, remove all but keep the most recent one
      // if (tempGroups.length > 1) {
      //   // Remove all temp groups except the last one
      //   tempGroups.slice(0, -1).forEach((group) => {
      //     ungroupNodes(group.id);
      //   });
      // }

      // Get fresh nodes after potential ungroup operations
      const { data } = useCanvasStore.getState();
      const freshNodes = data[canvasId]?.nodes ?? [];

      // 如果没有选中节点，直接返回
      if (!selectedNodes.length) {
        return;
      }

      if (selectedNodes.length < 2) {
        // If less than 2 nodes selected and there's a temp group, remove it
        const existingTempGroup = freshNodes.find((n) => n.type === 'group' && n.data?.metadata?.isTemporary);
        if (existingTempGroup) {
          ungroupNodes(existingTempGroup.id);
          setTempGroupId(null);
        }
        return;
      }

      // Get fresh nodes again after potential ungroup operation
      const latestNodes = useCanvasStore.getState().data[canvasId]?.nodes ?? [];
      const existingTempGroup = latestNodes.find((n) => n.type === 'group' && n.data?.metadata?.isTemporary);

      if (existingTempGroup) {
        // Update existing temporary group
        // Pass the latest nodes to updateTempGroup
        updateTempGroup(selectedNodes, latestNodes, existingTempGroup.id);
      } else {
        // Create new temporary group
        // selectedNodes might contain outdated positions, so we need to map to fresh nodes
        const freshSelectedNodes = selectedNodes.map((selectedNode) => {
          const freshNode = latestNodes.find((n) => n.id === selectedNode.id);
          return freshNode || selectedNode;
        });
        createTemporaryGroup(freshSelectedNodes);
      }
    },
    [updateNodesWithSync, createTemporaryGroup, updateTempGroup, setTempGroupId, ungroupNodes, canvasId],
  );

  const deselectNode = useCallback(
    (node: CanvasNode) => {
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];
      const updatedNodes = nodes.map((n) => ({
        ...n,
        selected: n.id === node.id ? false : n.selected,
      }));
      setNodes(canvasId, updatedNodes);
    },
    [canvasId, setNodes],
  );

  const deselectNodeByEntity = useCallback(
    (filter: CanvasNodeFilter) => {
      const { type, entityId } = filter;
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];
      const node = nodes.find((n) => n.type === type && n.data?.entityId === entityId);
      if (node) {
        deselectNode(node);
      }
    },
    [canvasId, deselectNode],
  );

  return {
    setSelectedNode,
    addSelectedNode,
    setSelectedNodeByEntity,
    addSelectedNodeByEntity,
    setSelectedNodes,
    deselectNode,
    deselectNodeByEntity,
    createGroupFromSelectedNodes,
    ungroupNodes,
    createTemporaryGroup,
    tempGroupId,
    convertTemporaryToPermGroup,
    ungroupMultipleNodes,
  };
};
