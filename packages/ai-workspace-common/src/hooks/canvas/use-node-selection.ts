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
        if (node.type === 'group') {
          return {
            width: (node.data as any)?.metadata?.width ?? 200,
            height: (node.data as any)?.metadata?.height ?? 100,
          };
        }
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
      // 如果没有选中节点，直接返回
      if (!selectedNodes.length) {
        return;
      }

      // 如果只选中了一个节点，不需要创建临时组
      if (selectedNodes.length < 2) {
        return;
      }

      // 获取最新的节点状态
      const { data } = useCanvasStore.getState();
      const latestNodes = data[canvasId]?.nodes ?? [];

      // 检查是否存在临时组
      const existingTempGroup = latestNodes.find((n) => n.type === 'group' && n.data?.metadata?.isTemporary);

      // 检查选中的节点中是否有来自现有组的节点
      const selectedGroups = selectedNodes.filter((node) => node.type === 'group');
      const selectedNonGroups = selectedNodes.filter((node) => node.type !== 'group' && !node.parentId);

      // 如果选中的节点中包含组节点，检查是否满足创建新组的条件
      if (selectedGroups.length > 0) {
        // 如果只选中了组节点，没有其他独立节点，不创建新组
        if (selectedNonGroups.length === 0) {
          return;
        }
      }

      // 如果存在临时组，检查选中节点是否有变化
      if (existingTempGroup) {
        const currentSelectedIds = new Set([...selectedGroups.map((n) => n.id), ...selectedNonGroups.map((n) => n.id)]);
        const currentGroupChildren = latestNodes.filter((n) => n.parentId === existingTempGroup.id);
        const currentChildrenIds = new Set(currentGroupChildren.map((n) => n.id));

        // 如果选中节点和当前组内节点完全相同，则不需要更新
        if (
          currentSelectedIds.size === currentChildrenIds.size &&
          [...currentSelectedIds].every((id) => currentChildrenIds.has(id))
        ) {
          return;
        }

        // 如果临时组存在，且选中节点发生变化，删除临时组
        let updatedNodes = latestNodes
          .map((node) => {
            if (node.parentId === existingTempGroup.id) {
              const { parentId, extent, ...nodeWithoutParent } = node;
              return {
                ...nodeWithoutParent,
                position: {
                  x: existingTempGroup.position.x + node.position.x,
                  y: existingTempGroup.position.y + node.position.y,
                },
                selected: selectedNodes.some((n) => n.id === node.id),
              };
            }
            return node;
          })
          .filter((node) => node.id !== existingTempGroup.id);

        // 更新节点状态
        updateNodesWithSync(sortNodes(updatedNodes));
        setTempGroupId(null);
        return;
      }

      // 获取要组合的节点（包括组节点和非组节点）
      const nodesToGroup = [...selectedGroups, ...selectedNonGroups];

      // 如果没有需要组合的节点，直接返回
      if (nodesToGroup.length < 2) {
        return;
      }

      // 计算新组的尺寸和位置
      const getNodeDimensions = (node: Node) => {
        if (node.type === 'group') {
          // 对于组节点，需要考虑其内部节点的位置
          const groupChildren = latestNodes.filter((n) => n.parentId === node.id);
          if (groupChildren.length > 0) {
            const childPositions = groupChildren.map((child) => ({
              x: node.position.x + child.position.x,
              y: node.position.y + child.position.y,
              width: child.measured?.width ?? child.width ?? 200,
              height: child.measured?.height ?? child.height ?? 100,
            }));

            const left = Math.min(...childPositions.map((p) => p.x));
            const right = Math.max(...childPositions.map((p) => p.x + p.width));
            const top = Math.min(...childPositions.map((p) => p.y));
            const bottom = Math.max(...childPositions.map((p) => p.y + p.height));

            return {
              width: right - left + 40, // 添加一些padding
              height: bottom - top + 40,
            };
          }
          return {
            width: (node.data as any)?.metadata?.width ?? 200,
            height: (node.data as any)?.metadata?.height ?? 100,
          };
        }
        const width = node.measured?.width ?? node.width ?? 200;
        const height = node.measured?.height ?? node.height ?? 100;
        return { width, height };
      };

      // 计算组的边界，需要考虑节点可能在其他组内的情况
      const nodeBoundaries = nodesToGroup.map((node) => {
        const { width, height } = getNodeDimensions(node);
        let position = { ...node.position };

        return {
          left: position.x,
          right: position.x + width,
          top: position.y,
          bottom: position.y + height,
        };
      });

      const minX = Math.min(...nodeBoundaries.map((b) => b.left));
      const maxX = Math.max(...nodeBoundaries.map((b) => b.right));
      const minY = Math.min(...nodeBoundaries.map((b) => b.top));
      const maxY = Math.max(...nodeBoundaries.map((b) => b.bottom));

      const PADDING = 40;
      const width = maxX - minX + PADDING;
      const height = maxY - minY + PADDING;

      // 创建新的组节点
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
          border: 'none',
          boxShadow: 'none',
          width: width,
          height: height,
        },
      });

      // 更新节点位置到新组内，保持原有的组结构
      let updatedNodes = latestNodes.map((node) => {
        // 只处理被选中的组节点和独立节点，不处理组内的子节点
        if (selectedGroups.some((g) => g.id === node.id) || selectedNonGroups.some((n) => n.id === node.id)) {
          const nodePosition = { ...node.position };
          return {
            ...node,
            parentId: groupNode.id,
            extent: 'parent' as const,
            positionAbsolute: nodePosition,
            position: {
              x: nodePosition.x - minX + PADDING / 2,
              y: nodePosition.y - minY + PADDING / 2,
            },
            selected: true,
            draggable: true,
          };
        }
        // 保持其他节点不变，包括原有组内的节点
        return node;
      });

      // 添加新组节点
      updatedNodes = [...updatedNodes, groupNode];

      // 更新节点状态
      updateNodesWithSync(sortNodes(updatedNodes));
      setTempGroupId(groupNode.id);
    },
    [canvasId, updateNodesWithSync, setTempGroupId],
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
