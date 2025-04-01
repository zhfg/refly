import { useMemo } from 'react';
import { Node, Edge } from '@xyflow/react';
import { NodeData } from '../types';
import { getLayoutedElements } from '../utils/layout';

interface MindMapDataProps {
  mindMapData: NodeData;
  expandedNodes: Set<string>;
  handleToggleExpand: (nodeId: string) => void;
  handleLabelChange: (nodeId: string, label: string) => void;
  handleContentChange?: (nodeId: string, markdown: string, jsonContent: any) => void;
  handleColorChange?: (nodeId: string, colors: { bg: string; border: string }) => void;
  handleAddChild: (nodeId: string) => void;
  handleAddSibling: (nodeId: string) => void;
  nodeHeights?: Map<string, number>;
  onNodeResize?: (nodeId: string, width: number, height: number) => void;
  operatingNodeId?: string | null;
  hoveredNodeId?: string | null;
}

export const useMindMapData = ({
  mindMapData,
  expandedNodes,
  handleToggleExpand,
  handleLabelChange,
  handleContentChange,
  handleColorChange,
  handleAddChild,
  handleAddSibling,
  nodeHeights = new Map(),
  onNodeResize,
  operatingNodeId = null,
  hoveredNodeId = null,
}: MindMapDataProps) => {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodeMap = new Map<string, Node>();
    const childrenMap = new Map<string, Node[]>();

    // Default edge style - make lines more visible
    const edgeStyle = {
      stroke: '#94a3b8', // More visible slate-400 color
      strokeWidth: 1.5,
    };

    // Get node color based on level (for visual hierarchy)
    const getNodeColor = (level: number, isRoot: boolean) => {
      if (isRoot) return { bg: 'rgb(239 246 255)', border: 'rgb(96 165 250)' }; // blue-50, blue-400

      const colors = [
        { bg: 'rgb(239 246 255)', border: 'rgb(96 165 250)' }, // blue-50, blue-400
        { bg: 'rgb(240 253 244)', border: 'rgb(74 222 128)' }, // green-50, green-400
        { bg: 'rgb(254 249 195)', border: 'rgb(250 204 21)' }, // yellow-50, yellow-400
        { bg: 'rgb(254 242 242)', border: 'rgb(248 113 113)' }, // red-50, red-400
        { bg: 'rgb(240 237 255)', border: 'rgb(139 92 246)' }, // purple-50, purple-400
      ];

      return colors[level % colors.length];
    };

    // First pass: create all nodes and establish parent-child relationships
    const createNode = (node: NodeData, level: number, parentId?: string) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedNodes.has(node.id);
      const childCount = node.children?.length || 0;
      const isRoot = level === 0 && !parentId;
      const colors = node.colors || getNodeColor(level, isRoot);
      const isOperating = node.id === operatingNodeId;
      const isHovered = node.id === hoveredNodeId;

      // Get node height from map or use default height based on content
      const nodeHeight = nodeHeights.get(node.id) || (hasChildren ? 80 : 60);

      // Create the node
      const reactFlowNode: Node = {
        id: node.id,
        type: 'custom',
        data: {
          label: node.label,
          content: node.content || node.label,
          richTextContent: node.richTextContent,
          hasChildren,
          isExpanded,
          childCount,
          isRoot,
          isOperating,
          isHovered,
          onToggleExpand: handleToggleExpand,
          onLabelChange: handleLabelChange,
          onContentChange: handleContentChange,
          onColorChange: handleColorChange,
          onAddChild: handleAddChild,
          onAddSibling: handleAddSibling,
          onResizeNode: onNodeResize,
          colors, // Pass colors to the node
          level, // Pass level information to node
        },
        position: { x: 0, y: 0 }, // Initial position will be set by layout algorithm
        measured: {
          width: 400, // Fixed width for nodes
          height: nodeHeight, // Dynamic height
        },
        // Set higher zIndex for hovered or operating nodes
        zIndex: isHovered ? 1000 : isOperating ? 500 : 0,
      };

      nodes.push(reactFlowNode);
      nodeMap.set(node.id, reactFlowNode);

      // Store parent-child relationship
      if (parentId) {
        const siblings = childrenMap.get(parentId) || [];
        siblings.push(reactFlowNode);
        childrenMap.set(parentId, siblings);

        // Create edge
        const edgeId = `${parentId}-${node.id}`;

        edges.push({
          id: edgeId,
          source: parentId,
          target: node.id,
          sourceHandle: `${parentId}-source`,
          targetHandle: `${node.id}-target`,
          type: 'smoothstep', // Use smoothstep for more organic flow
          style: {
            ...edgeStyle,
            stroke: colors.border, // Match edge color to node border
          },
          animated: false,
        });
      }

      // Process children if expanded
      if (isExpanded && node.children) {
        for (const child of node.children) {
          createNode(child, level + 1, node.id);
        }
      }
    };

    // Create the initial nodes
    createNode(mindMapData, 0);

    // Apply dagre layout algorithm
    const layoutOptions = {
      direction: 'LR', // Left to right layout
      nodeSep: 10, // Node separation distance
      rankSep: 250, // Rank separation distance (between levels)
      ranker: 'network-simplex', // Use network-simplex for better hierarchical layouts
    };

    const { nodes: layoutedNodes } = getLayoutedElements(nodes, edges, layoutOptions);

    return { nodes: layoutedNodes, edges };
  }, [
    mindMapData,
    expandedNodes,
    handleToggleExpand,
    handleLabelChange,
    handleContentChange,
    handleColorChange,
    handleAddChild,
    handleAddSibling,
    nodeHeights,
    onNodeResize,
    operatingNodeId,
    hoveredNodeId, // Add hoveredNodeId to dependencies
  ]);

  return {
    nodes,
    edges,
  };
};
