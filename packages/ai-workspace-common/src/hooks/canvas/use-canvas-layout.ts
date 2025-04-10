import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import Dagre from '@dagrejs/dagre';
import { CanvasNode } from '../../components/canvas/nodes';
import { Edge } from '@xyflow/react';
import { useCanvasSync } from './use-canvas-sync';

const getLayoutedElements = (
  nodes: CanvasNode<any>[],
  edges: Edge[],
  options: { direction: 'TB' | 'LR' },
) => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: options.direction,
    nodesep: 100,
    ranksep: 80,
    marginx: 50,
    marginy: 50,
  });

  // First, add all edges to the graph
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  // Add all nodes to the graph
  for (const node of nodes) {
    g.setNode(node.id, {
      ...node,
      width: node.measured?.width ?? 288,
      height: node.measured?.height ?? 320,
    });
  }

  // Run the layout algorithm
  Dagre.layout(g);

  // Process nodes and preserve group node positions
  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = g.node(node.id);

      // If the node is inside a group, preserve its relative position
      if (node.parentId) {
        const parentNode = nodes.find((n) => n.id === node.parentId);
        if (parentNode) {
          // Keep the original relative position within the group
          return node;
        }
      }

      // For non-group nodes, apply the new layout position
      return {
        ...node,
        position: { x: nodeWithPosition.x, y: nodeWithPosition.y },
      };
    }),
    edges,
  };
};

export const useCanvasLayout = () => {
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow<CanvasNode<any>>();

  const { syncNodesToYDoc, syncEdgesToYDoc } = useCanvasSync();
  const { fitView } = useReactFlow();

  const onLayout = useCallback(
    (direction: 'TB' | 'LR') => {
      const nodes = getNodes();
      const edges = getEdges();
      const layouted = getLayoutedElements(nodes, edges, { direction });

      setNodes(layouted.nodes);
      setEdges(layouted.edges);
      syncNodesToYDoc(layouted.nodes);
      syncEdgesToYDoc(layouted.edges);

      window.requestAnimationFrame(() => {
        fitView({
          padding: 0.2,
          duration: 200,
          maxZoom: 1,
        });
      });
    },
    [fitView, setNodes, setEdges, syncNodesToYDoc, syncEdgesToYDoc],
  );

  return {
    onLayout,
  };
};
