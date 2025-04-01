'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ReactFlow, Controls, Background, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NodeData } from './types';
import { nodeTypes } from './nodes';
import { useMindMapOperation } from './hooks/use-mind-map-operation';
import { useMindMapData } from './hooks/use-mind-map-data';

interface MindMapProps {
  data: NodeData;
  onNodeClick: (node: NodeData) => void;
  onChange?: (updatedData: NodeData) => void;
}

const proOptions = { hideAttribution: true };

export default function MindMap({ data, onNodeClick, onChange }: MindMapProps) {
  const [mindMapData, setMindMapData] = useState<NodeData>(data);
  const reactFlowInstance = useRef<any>(null);
  const [lastAddedNodeId, setLastAddedNodeId] = useState<string>('');
  const [nodeHeights, setNodeHeights] = useState<Map<string, number>>(new Map());
  const [operatingNodeId, setOperatingNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Custom setMindMapData that also updates parent
  const updateMindMapData = useCallback(
    (newData: NodeData) => {
      setMindMapData(newData);
      onChange?.(newData);
    },
    [onChange],
  );

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

  const {
    handleToggleExpand,
    handleLabelChange,
    handleContentChange,
    handleColorChange,
    handleAddChild,
    handleAddSibling,
    handleDeleteNode,
  } = useMindMapOperation({
    mindMapData,
    setMindMapData: updateMindMapData,
    expandedNodes,
    setExpandedNodes,
    lastAddedNodeId,
    setLastAddedNodeId,
  });

  // Handle node resizing and trigger layout update
  const handleNodeResize = useCallback((nodeId: string, _width: number, height: number) => {
    setNodeHeights((prev) => {
      const newHeights = new Map(prev);
      newHeights.set(nodeId, height);
      return newHeights;
    });
  }, []);

  const { nodes, edges } = useMindMapData({
    mindMapData,
    expandedNodes,
    handleToggleExpand,
    handleLabelChange,
    handleContentChange,
    handleColorChange,
    handleAddChild,
    handleAddSibling,
    handleDeleteNode,
    nodeHeights,
    onNodeResize: handleNodeResize,
    operatingNodeId,
    hoveredNodeId,
  });

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: any) => {
      // If node is in edit mode, don't propagate click - let the editor handle it
      if (node.id === operatingNodeId) {
        const target = event.target as HTMLElement;
        // Only stop propagation if clicking on editor content
        if (target.closest('.ProseMirror') || target.closest('.select-text')) {
          event.stopPropagation();
          return;
        }
      }

      // Set operating node if clicking directly on node (not a button)
      const target = event.target as HTMLElement;
      if (!target.closest('button')) {
        setOperatingNodeId(node.id);
      }

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
    },
    [mindMapData, onNodeClick, operatingNodeId],
  );

  // Reset operating node when clicking on the canvas
  const handlePaneClick = useCallback(() => {
    setOperatingNodeId(null);
  }, []);

  // Handler for node hover events
  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredNodeId(nodeId);
  }, []);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
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
        panOnScroll={true}
        zoomOnScroll={true}
        selectionOnDrag={false}
        panOnDrag={!operatingNodeId}
        nodesFocusable={true}
        onNodeMouseEnter={(_e, node) => handleNodeHover(node.id)}
        onNodeMouseLeave={() => handleNodeHover(null)}
      >
        <Controls showInteractive={false} className="bg-white border border-gray-200 shadow-sm" />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#E5E7EB" />
      </ReactFlow>
    </div>
  );
}
