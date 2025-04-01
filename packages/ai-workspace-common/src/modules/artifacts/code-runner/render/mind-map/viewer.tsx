'use client';

import React, { useState, useRef } from 'react';
import { ReactFlow, Controls, Background, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NodeData } from './types';
import { nodeTypes } from './nodes';
import { useMindMapOperation } from './hooks/use-mind-map-operation';
import { useMindMapData } from './hooks/use-mind-map-data';

interface MindMapProps {
  data: NodeData;
  onNodeClick: (node: NodeData) => void;
}

const proOptions = { hideAttribution: true };

export default function MindMap({ data, onNodeClick }: MindMapProps) {
  const [mindMapData, setMindMapData] = useState<NodeData>(data);
  const reactFlowInstance = useRef<any>(null);
  const [lastAddedNodeId, setLastAddedNodeId] = useState<string>('');

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

  const { handleToggleExpand, handleLabelChange, handleAddChild, handleAddSibling } =
    useMindMapOperation({
      mindMapData,
      setMindMapData,
      expandedNodes,
      setExpandedNodes,
      lastAddedNodeId,
      setLastAddedNodeId,
    });

  const { nodes, edges } = useMindMapData({
    mindMapData,
    expandedNodes,
    handleToggleExpand,
    handleLabelChange,
    handleAddChild,
    handleAddSibling,
  });

  const handleNodeClick = (_: React.MouseEvent, node: any) => {
    // Find the original NodeData that matches this id
    const findNodeData = (id: string, root: NodeData): NodeData | undefined => {
      if (root.id === id) return root;
      if (!root.children) return undefined;

      for (const child of root.children) {
        const found = findNodeData(id, child);
        if (found) return found;
      }

      return undefined;
    };

    const originalData = findNodeData(node.id, mindMapData);
    if (originalData) {
      onNodeClick(originalData);
    }
  };

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={handleNodeClick}
        nodesDraggable={true}
        elementsSelectable={true}
        nodeTypes={nodeTypes}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          type: 'step',
          style: { stroke: '#94a3b8', strokeWidth: 1.5 },
        }}
        proOptions={proOptions}
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Controls showInteractive={false} className="bg-white border border-gray-200 shadow-sm" />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#E5E7EB" />
      </ReactFlow>
    </div>
  );
}
