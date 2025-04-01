'use client';

import React, { useMemo, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Position,
  Background,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NodeData } from './types';

interface MindMapProps {
  data: NodeData;
  onNodeClick: (node: NodeData) => void;
}

const proOptions = { hideAttribution: true };

export default function MindMap({ data, onNodeClick }: MindMapProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const allIds = new Set<string>();
    const collectIds = (node: NodeData) => {
      allIds.add(node.id);
      if (node.children) {
        for (const child of node.children) {
          collectIds(child);
        }
      }
    };
    collectIds(data);
    return allIds;
  });

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let xOffset = 50;
    const ySpacing = 120;

    const processNode = (node: NodeData, level: number, parentId?: string) => {
      const nodeWidth = 200;
      const xSpacing = nodeWidth + 100;
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedNodes.has(node.id);

      nodes.push({
        id: node.id,
        data: {
          label: node.label,
          hasChildren,
        },
        style: {
          backgroundColor: '#ffffff',
          borderColor: '#E4E4E7',
          borderWidth: 1,
          borderRadius: 8,
          padding: 10,
          width: 200,
        },
        className: `react-flow__node ${hasChildren ? 'cursor-pointer' : ''} rounded-lg border border-gray-200`,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        position: {
          x: level * xSpacing,
          y: xOffset * ySpacing,
        },
      });

      if (parentId) {
        edges.push({
          id: `${parentId}-${node.id}`,
          source: parentId,
          target: node.id,
          type: 'bezier',
          style: {
            stroke: '#DEDDDF',
          },
        });
      }

      if (isExpanded && node.children) {
        for (const child of node.children) {
          xOffset++;
          processNode(child, level + 1, node.id);
        }
      }
    };

    processNode(data, 0);
    return { nodes, edges };
  }, [data, expandedNodes]);

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    if (node.data.hasChildren) {
      setExpandedNodes((prev) => {
        const next = new Set(prev);
        if (next.has(node.id)) {
          next.delete(node.id);
        } else {
          next.add(node.id);
        }
        return next;
      });
    }
    // Find the original NodeData that matches this id
    const findNodeData = (id: string, root: NodeData): NodeData | undefined => {
      if (root.id === id) return root;
      return root.children?.find((child) => findNodeData(id, child));
    };

    const originalData = findNodeData(node.id, data);
    if (originalData) {
      onNodeClick(originalData);
    }
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodeClick={handleNodeClick}
      nodesDraggable={true}
      fitView
      proOptions={proOptions}
    >
      <Controls />
      <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
    </ReactFlow>
  );
}
