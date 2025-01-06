import { Node, useReactFlow, XYPosition } from '@xyflow/react';
import { CanvasNodeFilter } from './use-node-selection';
import { useCallback } from 'react';
import Dagre from '@dagrejs/dagre';
import { useCanvasStore } from '@refly-packages/ai-workspace-common/stores/canvas';

interface NodeData extends Record<string, unknown> {
  connections?: string[];
}

interface CalculateNodePositionParams {
  nodes: Node<NodeData>[];
  sourceNodes?: Node<NodeData>[];
  connectTo?: CanvasNodeFilter[];
  defaultPosition?: XYPosition;
  edges?: any[];
}

interface LayoutBranchOptions {
  fromRoot?: boolean; // 是否从根节点开始布局
}

const SPACING = {
  X: 400, // Keep original X spacing
  Y: 30, // Fixed vertical spacing between nodes
  INITIAL_X: 100,
  INITIAL_Y: 300,
};

// Helper function to get root nodes (nodes with no incoming edges)
const getRootNodes = (nodes: Node[], edges: any[]): Node[] => {
  return nodes.filter((node) => !edges.some((edge) => edge.target === node.id));
};

// Helper function to get all nodes in a branch starting from specific nodes
const getBranchNodes = (
  startNodeIds: string[],
  nodes: Node[],
  edges: any[],
  visited: Set<string> = new Set(),
): Node[] => {
  const branchNodes: Node[] = [];
  const queue = [...startNodeIds];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const node = nodes.find((n) => n.id === currentId);
    if (node) {
      branchNodes.push(node);

      // Only get outgoing connections to maintain hierarchy
      const outgoingIds = edges.filter((e) => e.source === currentId).map((e) => e.target);

      queue.push(...outgoingIds);
    }
  }

  return branchNodes;
};

// Get nodes at specific level
const getNodesAtLevel = (nodes: Node[], edges: any[], level: number, rootNodes: Node[]): Node[] => {
  const result: Node[] = [];
  const visited = new Set<string>();
  const queue: Array<{ node: Node; level: number }> = rootNodes.map((node) => ({ node, level: 0 }));

  while (queue.length > 0) {
    const { node, level: currentLevel } = queue.shift()!;

    if (visited.has(node.id)) continue;
    visited.add(node.id);

    if (currentLevel === level) {
      result.push(node);
      continue;
    }

    // Add next level nodes to queue
    const nextNodes = edges
      .filter((edge) => edge.source === node.id)
      .map((edge) => nodes.find((n) => n.id === edge.target))
      .filter((n): n is Node => n !== undefined)
      .map((node) => ({ node, level: currentLevel + 1 }));

    queue.push(...nextNodes);
  }

  return result;
};

// Get the level of a node from root
const getNodeLevel = (nodeId: string, nodes: Node[], edges: any[], rootNodes: Node[]): number => {
  const visited = new Set<string>();
  const queue: Array<{ id: string; level: number }> = rootNodes.map((node) => ({ id: node.id, level: 0 }));

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;

    if (id === nodeId) return level;
    if (visited.has(id)) continue;
    visited.add(id);

    const nextIds = edges.filter((edge) => edge.source === id).map((edge) => ({ id: edge.target, level: level + 1 }));

    queue.push(...nextIds);
  }

  return -1;
};

// Helper function to get node height
const getNodeHeight = (node: Node): number => {
  return node.measured?.height ?? 320;
};

// Layout a branch using Dagre while preserving root positions
const layoutBranch = (
  branchNodes: Node[],
  edges: any[],
  rootNodes: Node[],
  options: LayoutBranchOptions = {},
): Node[] => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  // Configure the layout
  g.setGraph({
    rankdir: 'LR',
    nodesep: SPACING.Y,
    ranksep: SPACING.X,
    marginx: 50,
    marginy: 50,
  });

  // Add all nodes to the graph
  branchNodes.forEach((node) => {
    g.setNode(node.id, {
      ...node,
      width: node.measured?.width ?? 288,
      height: node.measured?.height ?? 320,
    });
  });

  // Add edges
  edges.forEach((edge) => {
    if (branchNodes.some((n) => n.id === edge.source) && branchNodes.some((n) => n.id === edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  });

  // Get the maximum level in the branch
  const maxLevel = Math.max(...branchNodes.map((node) => getNodeLevel(node.id, branchNodes, edges, rootNodes)));

  // Fix positions based on mode
  branchNodes.forEach((node) => {
    const level = getNodeLevel(node.id, branchNodes, edges, rootNodes);
    const isRoot = rootNodes.some((root) => root.id === node.id);
    const shouldFixPosition = options.fromRoot ? isRoot : level < maxLevel;

    if (shouldFixPosition) {
      g.setNode(node.id, {
        ...g.node(node.id),
        x: node.position.x,
        y: node.position.y,
        fixed: true,
      });
    }
  });

  // Apply layout
  Dagre.layout(g);

  // Return nodes with updated positions
  return branchNodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    const level = getNodeLevel(node.id, branchNodes, edges, rootNodes);
    const isRoot = rootNodes.some((root) => root.id === node.id);
    const shouldPreservePosition = options.fromRoot ? isRoot : level < maxLevel;

    if (shouldPreservePosition) {
      return node; // Keep original position
    }

    // For non-fixed nodes, ensure they maintain relative Y position to their source nodes
    const sourceEdges = edges.filter((edge) => edge.target === node.id);
    if (sourceEdges.length > 0 && !options.fromRoot) {
      const sourceNodes = sourceEdges
        .map((edge) => branchNodes.find((n) => n.id === edge.source))
        .filter((n): n is Node => n !== undefined);

      if (sourceNodes.length > 0) {
        const avgSourceY = sourceNodes.reduce((sum, n) => sum + n.position.y, 0) / sourceNodes.length;
        return {
          ...node,
          position: {
            x: nodeWithPosition.x,
            y: avgSourceY, // Keep similar Y position as source nodes
          },
        };
      }
    }

    return {
      ...node,
      position: {
        x: nodeWithPosition.x,
        y: nodeWithPosition.y,
      },
    };
  });
};

// Get the branch cluster that a node belongs to
const getBranchCluster = (nodeId: string, nodes: Node[], edges: any[]): Node[] => {
  const visited = new Set<string>();
  const cluster = new Set<string>();
  const queue = [nodeId];

  // First traverse upwards to find root
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    cluster.add(currentId);

    // Add parent nodes
    const parentIds = edges.filter((edge) => edge.target === currentId).map((edge) => edge.source);
    queue.push(...parentIds);
  }

  // Then traverse downwards from all found nodes
  const downQueue = Array.from(cluster);
  visited.clear();

  while (downQueue.length > 0) {
    const currentId = downQueue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    // Add child nodes
    const childIds = edges.filter((edge) => edge.source === currentId).map((edge) => edge.target);
    downQueue.push(...childIds);
    childIds.forEach((id) => cluster.add(id));
  }

  return nodes.filter((node) => cluster.has(node.id));
};

// Get all connected nodes to the right of a given node
const getRightwardNodes = (nodeId: string, nodes: Node[], edges: any[]): Node[] => {
  const visited = new Set<string>();
  const rightwardNodes: Node[] = [];
  const queue = [nodeId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const currentNode = nodes.find((n) => n.id === currentId);
    if (currentNode) {
      rightwardNodes.push(currentNode);

      // Only follow outgoing edges to nodes that are to the right
      const outgoingIds = edges
        .filter((edge) => edge.source === currentId)
        .map((edge) => edge.target)
        .filter((targetId) => {
          const targetNode = nodes.find((n) => n.id === targetId);
          return targetNode && targetNode.position.x >= currentNode.position.x;
        });

      queue.push(...outgoingIds);
    }
  }

  return rightwardNodes;
};

// Get the rightmost position for a new node
const getRightmostPosition = (sourceNodes: Node[], nodes: Node[], edges: any[]): XYPosition => {
  // Calculate X position
  const rightmostSourceX = Math.max(...sourceNodes.map((n) => n.position.x));
  const targetX = rightmostSourceX + SPACING.X;

  // Get all nodes at the same X level
  const nodesAtTargetLevel = nodes
    .filter((node) => Math.abs(node.position.x - targetX) < SPACING.X / 2)
    .sort((a, b) => a.position.y - b.position.y);

  // Calculate average Y of source nodes
  const avgSourceY = sourceNodes.reduce((sum, n) => sum + n.position.y, 0) / sourceNodes.length;

  // If no nodes at this level, place at average Y of source nodes
  if (nodesAtTargetLevel.length === 0) {
    return {
      x: targetX,
      y: avgSourceY,
    };
  }

  // Calculate the best position based on existing nodes
  const fixedSpacing = SPACING.Y;

  // Calculate position for new node
  let bestY = avgSourceY;
  let minOverlap = Infinity;

  // Try different Y positions around the average source Y
  const range = Math.max(fixedSpacing * 3, getNodeHeight(nodesAtTargetLevel[0]));
  const step = fixedSpacing / 4;

  for (let y = avgSourceY - range; y <= avgSourceY + range; y += step) {
    let hasOverlap = false;
    let totalOverlap = 0;

    // Check overlap with existing nodes considering node heights
    for (const node of nodesAtTargetLevel) {
      const nodeHeight = getNodeHeight(node);
      const newNodeHeight = 320; // Default height for new node

      // Calculate the vertical overlap between the two nodes
      const nodeTop = node.position.y - nodeHeight / 2;
      const nodeBottom = node.position.y + nodeHeight / 2;
      const newNodeTop = y - newNodeHeight / 2;
      const newNodeBottom = y + newNodeHeight / 2;

      // Check if the nodes overlap vertically
      if (!(newNodeBottom < nodeTop - fixedSpacing || newNodeTop > nodeBottom + fixedSpacing)) {
        hasOverlap = true;
        // Calculate the amount of overlap
        const overlap = Math.min(Math.abs(newNodeBottom - nodeTop), Math.abs(newNodeTop - nodeBottom));
        totalOverlap += overlap;
      }
    }

    // If this position has less overlap, use it
    if (totalOverlap < minOverlap) {
      minOverlap = totalOverlap;
      bestY = y;
    }

    // If we found a position with no overlap, use it immediately
    if (!hasOverlap) {
      bestY = y;
      break;
    }
  }

  // If we still have overlap, try to find the largest gap
  if (minOverlap > 0) {
    const gaps: { start: number; end: number }[] = [];
    const firstNode = nodesAtTargetLevel[0];
    const firstNodeHeight = getNodeHeight(firstNode);

    // Add gap before first node
    gaps.push({
      start: avgSourceY - range,
      end: firstNode.position.y - firstNodeHeight / 2 - fixedSpacing,
    });

    // Add gaps between nodes
    for (let i = 0; i < nodesAtTargetLevel.length - 1; i++) {
      const currentNode = nodesAtTargetLevel[i];
      const nextNode = nodesAtTargetLevel[i + 1];
      const currentNodeHeight = getNodeHeight(currentNode);
      const nextNodeHeight = getNodeHeight(nextNode);

      gaps.push({
        start: currentNode.position.y + currentNodeHeight / 2 + fixedSpacing,
        end: nextNode.position.y - nextNodeHeight / 2 - fixedSpacing,
      });
    }

    // Add gap after last node
    const lastNode = nodesAtTargetLevel[nodesAtTargetLevel.length - 1];
    const lastNodeHeight = getNodeHeight(lastNode);
    gaps.push({
      start: lastNode.position.y + lastNodeHeight / 2 + fixedSpacing,
      end: avgSourceY + range,
    });

    // Find the best gap
    let bestGap = { start: 0, end: 0, size: 0, distanceToAvg: Infinity };
    gaps.forEach((gap) => {
      const size = gap.end - gap.start;
      if (size >= fixedSpacing + 320) {
        // Consider minimum space needed for new node
        const gapCenter = (gap.start + gap.end) / 2;
        const distanceToAvg = Math.abs(gapCenter - avgSourceY);
        if (distanceToAvg < bestGap.distanceToAvg) {
          bestGap = { ...gap, size, distanceToAvg };
        }
      }
    });

    if (bestGap.size > 0) {
      bestY = (bestGap.start + bestGap.end) / 2;
    }
  }

  return {
    x: targetX,
    y: bestY,
  };
};

export const calculateNodePosition = ({
  nodes,
  sourceNodes,
  connectTo,
  defaultPosition,
  edges = [],
}: CalculateNodePositionParams): XYPosition => {
  // If position is provided, use it
  if (defaultPosition) {
    return defaultPosition;
  }

  // Case 1: No nodes exist - place in center-left of canvas
  if (nodes.length === 0) {
    return {
      x: SPACING.INITIAL_X,
      y: SPACING.INITIAL_Y,
    };
  }

  // Case 3: Connected to existing nodes
  if (sourceNodes?.length > 0) {
    const { autoLayout } = useCanvasStore.getState();

    if (!autoLayout) {
      // For each source node, find all its connected target nodes
      const connectedNodes = new Set<Node>();

      sourceNodes.forEach((sourceNode) => {
        // Find all direct target nodes of this source node
        edges.forEach((edge) => {
          if (edge.source === sourceNode.id) {
            const targetNode = nodes.find((n) => n.id === edge.target);
            if (targetNode) {
              connectedNodes.add(targetNode);
            }
          }
        });
      });

      // Calculate X position - place to the right of rightmost source node
      const rightmostSourceX = Math.max(...sourceNodes.map((n) => n.position.x));
      const targetX = rightmostSourceX + SPACING.X;

      if (connectedNodes.size > 0) {
        // Find the bottommost node among all connected nodes
        const bottomNode = Array.from(connectedNodes).reduce((bottom, current) => {
          const bottomY = bottom.position.y + (bottom.measured?.height ?? 320) / 2;
          const currentY = current.position.y + (current.measured?.height ?? 320) / 2;
          return currentY > bottomY ? current : bottom;
        });

        // Position new node below the bottommost connected node
        const bottomY = bottomNode.position.y + (bottomNode.measured?.height ?? 320) / 2;

        return {
          x: targetX,
          y: bottomY + SPACING.Y + 320 / 2, // Add spacing and half height for centering
        };
      } else {
        // If no connected nodes, place at average Y of source nodes
        const avgSourceY = sourceNodes.reduce((sum, n) => sum + n.position.y, 0) / sourceNodes.length;
        return {
          x: targetX,
          y: avgSourceY,
        };
      }
    }

    // If auto-layout is enabled or no branch nodes found, use original positioning logic
    return getRightmostPosition(sourceNodes, nodes, edges);
  }

  // Case 2: No specific connections - add to a new branch
  const rootNodes = getRootNodes(nodes, edges);

  if (rootNodes.length > 0) {
    // Sort root nodes by Y position
    const sortedRootNodes = [...rootNodes].sort((a, b) => a.position.y - b.position.y);

    // Try to find a gap between root nodes that's large enough
    for (let i = 0; i < sortedRootNodes.length - 1; i++) {
      const gap = sortedRootNodes[i + 1].position.y - sortedRootNodes[i].position.y;
      if (gap >= 30) {
        return {
          x: sortedRootNodes[i].position.x,
          y: sortedRootNodes[i].position.y + gap / 2,
        };
      }
    }

    // If no suitable gap found, place below the last root node
    const lastNode = sortedRootNodes[sortedRootNodes.length - 1];
    return {
      x: lastNode.position.x,
      y: lastNode.position.y + SPACING.Y + (lastNode.measured?.height ?? 320),
    };
  }

  // Fallback: Place to the right of existing nodes with proper spacing
  const rightmostNodes = nodes
    .filter((n) => {
      const isRightmost = !edges.some((e) => e.source === n.id);
      return isRightmost;
    })
    .sort((a, b) => a.position.y - b.position.y);

  if (rightmostNodes.length > 0) {
    // Try to find a gap between rightmost nodes
    for (let i = 0; i < rightmostNodes.length - 1; i++) {
      const gap = rightmostNodes[i + 1].position.y - rightmostNodes[i].position.y;
      if (gap >= 30) {
        return {
          x: Math.max(...rightmostNodes.map((n) => n.position.x)) + SPACING.X,
          y: rightmostNodes[i].position.y + gap / 2,
        };
      }
    }

    // If no suitable gap found, place below the last rightmost node
    const lastNode = rightmostNodes[rightmostNodes.length - 1];
    return {
      x: Math.max(...rightmostNodes.map((n) => n.position.x)) + SPACING.X,
      y: lastNode.position.y + SPACING.Y + (lastNode.measured?.height ?? 320),
    };
  }

  // Final fallback: Place at initial position with offset
  return {
    x: SPACING.INITIAL_X,
    y: SPACING.INITIAL_Y,
  };
};

export const useNodePosition = () => {
  const { getNode, setCenter, getNodes, setNodes } = useReactFlow();
  const reactFlowInstance = useReactFlow();

  const calculatePosition = useCallback((params: CalculateNodePositionParams) => calculateNodePosition(params), []);

  const setNodeCenter = useCallback(
    (nodeId: string) => {
      requestAnimationFrame(() => {
        const renderedNode = getNode(nodeId);
        const currentZoom = reactFlowInstance.getZoom();
        if (renderedNode) {
          setCenter(renderedNode.position.x + 200, renderedNode.position.y + 200, {
            duration: 300,
            zoom: currentZoom,
          });
        }
      });
    },
    [setCenter, getNode],
  );

  const layoutBranchAndUpdatePositions = useCallback(
    (
      startNodeIds: string[],
      allNodes: Node[],
      edges: any[],
      options: LayoutBranchOptions = {},
      needSetCenter: { targetNodeId: string; needSetCenter: boolean } = { targetNodeId: '', needSetCenter: true },
    ) => {
      // Get source nodes
      const sourceNodes = allNodes.filter((node) => startNodeIds.includes(node.id));

      // Find all nodes directly connected to source nodes and their connections
      const targetNodeIds = new Set<string>();
      const queue = [...startNodeIds];
      const visited = new Set<string>();

      // Find all connected nodes in the branch
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        edges.forEach((edge) => {
          if (edge.source === currentId && !startNodeIds.includes(edge.target)) {
            targetNodeIds.add(edge.target);
            queue.push(edge.target);
          }
        });
      }

      // Get target nodes that need to be laid out
      const targetNodes = allNodes.filter((node) => targetNodeIds.has(node.id));
      if (targetNodes.length === 0) return;

      // Group nodes by their level (distance from source nodes)
      const nodeLevels = new Map<number, Node[]>();
      const nodeLevel = new Map<string, number>();

      // Calculate levels for each node
      const calculateLevels = (nodeId: string, level: number) => {
        if (nodeLevel.has(nodeId)) return;
        nodeLevel.set(nodeId, level);

        const levelNodes = nodeLevels.get(level) || [];
        const node = allNodes.find((n) => n.id === nodeId);
        if (node) {
          levelNodes.push(node);
          nodeLevels.set(level, levelNodes);
        }

        // Process children
        edges.filter((edge) => edge.source === nodeId).forEach((edge) => calculateLevels(edge.target, level + 1));
      };

      // Start level calculation from source nodes
      sourceNodes.forEach((node) => calculateLevels(node.id, 0));

      // Sort nodes within each level by their Y position
      nodeLevels.forEach((nodes) => {
        nodes.sort((a, b) => a.position.y - b.position.y);
      });

      // First pass: Calculate initial positions
      const nodePositions = new Map<string, { x: number; y: number }>();
      const fixedSpacing = SPACING.Y; // Use fixed spacing between nodes

      // Process each level
      Array.from(nodeLevels.entries()).forEach(([level, nodes]) => {
        // Calculate X position for this level
        const levelX = Math.max(...sourceNodes.map((n) => n.position.x)) + level * SPACING.X;

        // Calculate total height needed for this level
        const totalHeight = nodes.reduce((sum, node) => {
          const nodeHeight = getNodeHeight(node);
          return sum + nodeHeight + fixedSpacing;
        }, -fixedSpacing); // Subtract one spacing since we don't need it after the last node

        // Calculate starting Y position (centered around average source Y)
        const avgSourceY = sourceNodes.reduce((sum, n) => sum + n.position.y, 0) / sourceNodes.length;
        let currentY = avgSourceY - totalHeight / 2;

        // Calculate center positions for nodes in this level
        nodes.forEach((node, index) => {
          const nodeHeight = getNodeHeight(node);

          // Get direct source nodes for this node
          const directSourceNodes = edges
            .filter((edge) => edge.target === node.id)
            .map((edge) => allNodes.find((n) => n.id === edge.source))
            .filter((n): n is Node => n !== undefined);

          if (directSourceNodes.length > 0) {
            // Try to align with average Y of source nodes
            const avgDirectSourceY =
              directSourceNodes.reduce((sum, n) => sum + n.position.y, 0) / directSourceNodes.length;
            // Adjust currentY to be closer to direct source nodes while maintaining spacing
            currentY = avgDirectSourceY - totalHeight / 2 + index * (nodeHeight + fixedSpacing);
          }

          nodePositions.set(node.id, {
            x: levelX,
            y: currentY + nodeHeight / 2, // Add half height to position at center
          });

          currentY += nodeHeight + fixedSpacing;
        });
      });

      // Second pass: Adjust positions to prevent overlaps
      const adjustOverlaps = () => {
        let hasOverlap = true;
        const maxIterations = 10;
        let iteration = 0;

        while (hasOverlap && iteration < maxIterations) {
          hasOverlap = false;
          iteration++;

          // Check each pair of nodes for overlaps
          Array.from(nodePositions.entries()).forEach(([nodeId, pos1]) => {
            const node1 = allNodes.find((n) => n.id === nodeId)!;
            const height1 = getNodeHeight(node1);

            Array.from(nodePositions.entries()).forEach(([otherId, pos2]) => {
              if (nodeId === otherId) return;

              const node2 = allNodes.find((n) => n.id === otherId)!;
              const height2 = getNodeHeight(node2);

              // Calculate the vertical overlap between the two nodes
              const node1Top = pos1.y - height1 / 2;
              const node1Bottom = pos1.y + height1 / 2;
              const node2Top = pos2.y - height2 / 2;
              const node2Bottom = pos2.y + height2 / 2;

              // Check if the nodes overlap vertically
              if (!(node1Bottom < node2Top - fixedSpacing || node1Top > node2Bottom + fixedSpacing)) {
                hasOverlap = true;
                // Move the node with higher Y value further down
                if (pos1.y > pos2.y) {
                  const newY = node2Bottom + fixedSpacing + height1 / 2;
                  nodePositions.set(nodeId, {
                    ...pos1,
                    y: newY,
                  });
                }
              }
            });
          });
        }
      };

      adjustOverlaps();

      // Apply the calculated positions
      const updatedNodes = allNodes.map((node) => {
        if (!targetNodeIds.has(node.id)) {
          return node; // Keep original position for non-target nodes
        }

        const newPosition = nodePositions.get(node.id);
        if (!newPosition) return node;

        return {
          ...node,
          position: newPosition,
        };
      });

      setNodes(updatedNodes);

      // Set center on the specified target node
      if (needSetCenter.needSetCenter && needSetCenter.targetNodeId) {
        setNodeCenter(needSetCenter.targetNodeId);
      }
    },
    [setNodes, setNodeCenter],
  );

  return { calculatePosition, setNodeCenter, layoutBranchAndUpdatePositions };
};
