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

export const PADDING = 40;

export const shouldDestroyTemporaryGroup = (selectedNodes: Node[]) => {
  return selectedNodes.length <= 1;
};

export const sortNodes = (nodes: Node[]) => {
  return nodes.sort((a, b) => {
    if (a.type === 'group') return -1;
    if (b.type === 'group') return 1;
    return 0;
  });
};

export const getValidSelectedNodes = (selectedNodes: CanvasNode<any>[], beforeNodes: CanvasNode<any>[]) => {
  return selectedNodes.filter((node) => {
    if (node.type === 'group' && !node.data?.metadata?.isTemporary) {
      return true;
    } else if (node.type === 'group' && node.data?.metadata?.isTemporary) {
      return false;
    }

    if (node.parentId) {
      const parent = beforeNodes.find((n) => n.id === node.parentId);
      if (parent?.type === 'group' && !parent.data?.metadata?.isTemporary) {
        return false;
      }
    }

    if (!node.parentId) {
      return true;
    }

    return true;
  });
};

// 计算新组的尺寸和位置
export const getNodeDimensions = (node: Node, latestNodes: Node[]) => {
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

export const calculateGroupBoundaries = (nodesToGroup: Node[], currentNodes: Node[]) => {
  // Calculate boundaries
  const nodeBoundaries = nodesToGroup.map((node) => {
    const { width, height } = getNodeDimensions(node, currentNodes);
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

  const dimensions = {
    width: maxX - minX,
    height: maxY - minY,
  };

  // Create group node
  const groupNode = prepareNodeData({
    type: 'group' as CanvasNodeType,
    data: {
      title: 'Group',
      entityId: genUniqueId(),
      metadata: {
        ...dimensions,
      },
    },
    position: {
      x: minX - PADDING / 2,
      y: minY - PADDING / 2,
    },
    className: 'react-flow__node-default important-box-shadow-none',
    style: {
      background: 'transparent',
      border: 'none',
      boxShadow: 'none',
      ...dimensions,
    },
    selected: true,
    draggable: true,
  });

  return { groupNode, dimensions, minX, minY };
};
