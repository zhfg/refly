import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Connection, useReactFlow, Node, XYPosition } from '@xyflow/react';
import Dagre from '@dagrejs/dagre';
import { CanvasNodeType } from '@refly/openapi-schema';
import { applyEdgeChanges, applyNodeChanges, Edge, EdgeChange, NodeChange } from '@xyflow/react';
import { CanvasNode, prepareNodeData } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { useCanvasStore, useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { CanvasNodeData, getNodeDefaultMetadata } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';
import { EDGE_STYLES } from '../components/canvas/constants';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { genUniqueId } from '@refly-packages/utils/id';
import { useThrottledCallback } from 'use-debounce';

const getLayoutedElements = (nodes: CanvasNode<any>[], edges: Edge[], options: { direction: 'TB' | 'LR' }) => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: options.direction,
    nodesep: 100,
    ranksep: 80,
    marginx: 50,
    marginy: 50,
  });

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node) =>
    g.setNode(node.id, {
      ...node,
      width: node.measured?.width ?? 0,
      height: node.measured?.height ?? 0,
    }),
  );

  Dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const position = g.node(node.id);
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      const x = position.x - (node.measured?.width ?? 0) / 2;
      const y = position.y - (node.measured?.height ?? 0) / 2;

      return { ...node, position: { x, y } };
    }),
    edges,
  };
};

const deduplicateNodes = (nodes: CanvasNode<any>[]) => {
  const uniqueNodesMap = new Map();
  nodes.forEach((node) => uniqueNodesMap.set(node.id, node));
  return Array.from(uniqueNodesMap.values());
};

const deduplicateEdges = (edges: Edge[]) => {
  const uniqueEdgesMap = new Map();
  edges.forEach((edge) => uniqueEdgesMap.set(edge.id, edge));
  return Array.from(uniqueEdgesMap.values());
};

export interface CanvasNodeFilter {
  type: CanvasNodeType;
  entityId: string;
}

export const useCanvasControl = (selectedCanvasId?: string) => {
  const { canvasId: contextCanvasId, provider } = useCanvasContext();
  const ydoc = provider.document;

  const { t } = useTranslation();

  const { canvasId: routeCanvasId } = useParams();
  const canvasId = selectedCanvasId ?? contextCanvasId ?? routeCanvasId;

  const { data, setNodes, setEdges, setTitle, setModeRaw } = useCanvasStoreShallow((state) => ({
    data: state.data,
    setNodes: state.setNodes,
    setEdges: state.setEdges,
    setTitle: state.setTitle,
    setModeRaw: state.setMode,
  }));

  const nodes = data[canvasId]?.nodes ?? [];
  const edges = data[canvasId]?.edges ?? [];
  const mode = data[canvasId]?.mode ?? 'hand';

  const setCanvasTitle = useCallback(
    (title: string) => {
      const yTitle = ydoc.getText('title');
      ydoc.transact(() => {
        yTitle?.delete(0, yTitle?.length ?? 0);
        yTitle?.insert(0, title);
      });
    },
    [ydoc],
  );

  const setSelectedNode = useCallback(
    (node: CanvasNode<any> | null) => {
      const yNodes = ydoc.getArray('nodes');
      ydoc.transact(() => {
        const updatedNodes = yNodes.toJSON().map((n) => ({
          ...n,
          selected: n.id === node?.id,
        }));
        yNodes.delete(0, yNodes.length);
        yNodes.push(deduplicateNodes(updatedNodes));
      });
    },
    [ydoc],
  );

  const addSelectedNode = useCallback(
    (node: CanvasNode<any> | null) => {
      const yNodes = ydoc.getArray('nodes');
      ydoc.transact(() => {
        const updatedNodes = yNodes.toJSON().map((n) => ({
          ...n,
          selected: n.id === node?.id ? true : n.selected,
        }));
        yNodes.delete(0, yNodes.length);
        yNodes.push(deduplicateNodes(updatedNodes));
      });
    },
    [ydoc],
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

  const setSelectedNodes = useCallback(
    (nodes: CanvasNode<any>[]) => {
      console.log('setSelectedNodes', nodes);
      const yNodes = ydoc.getArray('nodes');
      ydoc.transact(() => {
        const updatedNodes = yNodes.toJSON().map((n) => ({
          ...n,
          selected: nodes.some((node) => node.id === n.id),
        }));
        yNodes.delete(0, yNodes.length);
        yNodes.push(deduplicateNodes(updatedNodes));
      });
    },
    [ydoc],
  );

  const deselectNode = useCallback(
    (node: CanvasNode) => {
      console.log('deselectNode', node);
      const yNodes = ydoc.getArray('nodes');
      ydoc.transact(() => {
        const updatedNodes = yNodes.toJSON().map((n) => ({
          ...n,
          selected: n.id === node.id ? false : n.selected,
        }));
        yNodes.delete(0, yNodes.length);
        yNodes.push(deduplicateNodes(updatedNodes));
      });
    },
    [ydoc],
  );

  const deselectNodeByEntity = useCallback(
    (filter: CanvasNodeFilter) => {
      console.log('deselectNodeByEntity');
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

  const setNodeData = useThrottledCallback(<T = any>(nodeId: string, data: Partial<CanvasNodeData<T>>) => {
    console.log('setNodeData', nodeId, data);
    const yNodes = ydoc.getArray('nodes');
    ydoc.transact(() => {
      const updatedNodes = yNodes.toJSON().map((n) => ({
        ...n,
        data: n.id === nodeId ? { ...n.data, ...data } : n.data,
      }));
      yNodes.delete(0, yNodes.length);
      yNodes.push(deduplicateNodes(updatedNodes));
    });
  }, 300);

  const setNodeDataByEntity = useCallback(
    <T = any>(filter: CanvasNodeFilter, nodeData: Partial<CanvasNodeData<T>>) => {
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];
      const node = nodes.find((n) => n.type === filter.type && n.data?.entityId === filter.entityId);
      if (node) {
        setNodeData(node.id, {
          ...node.data,
          ...nodeData,
          metadata: {
            ...node.data?.metadata,
            ...nodeData?.metadata,
          },
        });
      }
    },
    [canvasId, setNodeData],
  );

  const observersSet = useRef(false);

  const throttledSetNodes = useThrottledCallback((id: string, nodes: any) => setNodes(id, nodes), 300);
  const throttledSetEdges = useThrottledCallback((id: string, edges: any) => setEdges(id, edges), 300);
  const throttledSetTitle = useThrottledCallback((id: string, title: string) => setTitle(id, title), 300);

  useEffect(() => {
    if (!canvasId || !ydoc || observersSet.current) return;

    const yTitle = ydoc.getText('title');
    const yNodes = ydoc.getArray('nodes');
    const yEdges = ydoc.getArray('edges');

    const nodesObserver = () => {
      throttledSetNodes(canvasId, yNodes.toJSON());
    };

    const edgesObserver = () => {
      throttledSetEdges(canvasId, yEdges.toJSON());
    };

    const titleObserver = () => {
      throttledSetTitle(canvasId, yTitle.toString());
    };

    yNodes.observe(nodesObserver);
    yEdges.observe(edgesObserver);
    yTitle.observe(titleObserver);
    observersSet.current = true;

    return () => {
      yNodes.unobserve(nodesObserver);
      yEdges.unobserve(edgesObserver);
      yTitle.unobserve(titleObserver);
      observersSet.current = false;
    };
  }, [canvasId, ydoc, throttledSetNodes, throttledSetEdges, throttledSetTitle]);

  const { fitView, getNode, setCenter } = useReactFlow();

  const onLayout = useCallback(
    (direction: 'TB' | 'LR') => {
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];
      const edges = data[canvasId]?.edges ?? [];
      const layouted = getLayoutedElements(nodes, edges, { direction });

      const yNodes = ydoc.getArray('nodes');
      const yEdges = ydoc.getArray('edges');

      ydoc.transact(() => {
        yNodes.delete(0, yNodes.length);
        yNodes.push(deduplicateNodes(layouted.nodes));
        yEdges.delete(0, yEdges.length);
        yEdges.push(deduplicateEdges(layouted.edges));
      });

      window.requestAnimationFrame(() => {
        fitView({
          padding: 0.2,
          duration: 200,
          maxZoom: 1,
        });
      });
    },
    [canvasId, fitView],
  );

  const throttledNodesChange = useThrottledCallback((changes: NodeChange[]) => {
    const yNodes = ydoc.getArray('nodes');
    ydoc.transact(() => {
      const updatedNodes = applyNodeChanges(changes, yNodes.toJSON());
      yNodes.delete(0, yNodes.length);
      yNodes.push(deduplicateNodes(updatedNodes));
    });
  }, 300);

  const throttledEdgesChange = useThrottledCallback((changes: EdgeChange[]) => {
    const yEdges = ydoc.getArray('edges');
    ydoc.transact(() => {
      const updatedEdges = applyEdgeChanges(changes, yEdges.toJSON());
      yEdges.delete(0, yEdges.length);
      yEdges.push(deduplicateEdges(updatedEdges));
    });
  }, 300);

  const throttledConnect = useThrottledCallback((params: Connection) => {
    if (!params?.source || !params?.target) {
      console.warn('Invalid connection parameters');
      return;
    }

    const yEdges = ydoc.getArray('edges');
    ydoc.transact(() => {
      const newEdge = {
        ...params,
        id: `edge-${genUniqueId()}`,
        animated: false,
        style: EDGE_STYLES.default,
      };

      yEdges.delete(0, yEdges.length);
      yEdges.push(deduplicateEdges([...edges, newEdge]));
    });
  }, 300);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Apply changes locally first
      const updatedNodes = applyNodeChanges(changes, nodes) as CanvasNode<any>[];
      setNodes(canvasId, updatedNodes);

      // Synchronize with ydoc asynchronously
      throttledNodesChange(changes);
    },
    [canvasId, nodes, setNodes, applyNodeChanges, throttledNodesChange],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // Apply changes locally first
      const updatedEdges = applyEdgeChanges(changes, edges);
      setEdges(canvasId, updatedEdges);

      // Synchronize with ydoc asynchronously
      throttledEdgesChange(changes);
    },
    [canvasId, edges, setEdges, throttledEdgesChange],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      throttledConnect(params);
    },
    [throttledConnect],
  );

  const setNodeCenter = useCallback(
    (nodeId: string) => {
      // Center view on new node after it's rendered
      requestAnimationFrame(() => {
        const renderedNode = getNode(nodeId);
        if (renderedNode) {
          setCenter(renderedNode.position.x, renderedNode.position.y, {
            duration: 500,
            zoom: 1,
          });
        }
      });
    },
    [setCenter],
  );

  const addNode = useCallback(
    (
      node: { type: CanvasNodeType; data: CanvasNodeData<any>; position?: XYPosition },
      connectTo?: CanvasNodeFilter[],
    ) => {
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];
      const edges = data[canvasId]?.edges ?? [];

      if (!node?.type || !node?.data) {
        console.warn('Invalid node data provided');
        return;
      }

      let needSetCenter = false;

      // Check for existing node
      const existingNode = nodes.find((n) => n.type === node.type && n.data?.entityId === node.data?.entityId);
      if (existingNode) {
        message.warning(t('canvas.action.nodeAlreadyExists', { type: t(`common.${node.type}`) }));
        setSelectedNode(existingNode);
        return;
      }

      // Find source nodes
      const sourceNodes = connectTo
        ?.map((filter) => nodes.find((n) => n.type === filter.type && n.data?.entityId === filter.entityId))
        .filter(Boolean);

      // Calculate new node position
      let newPosition: XYPosition;

      if (sourceNodes?.length) {
        // Get all existing target nodes that are connected to any of the source nodes
        const existingTargetNodeIds = new Set(
          edges.filter((edge) => sourceNodes.some((source) => source.id === edge.source)).map((edge) => edge.target),
        );

        const existingTargetNodes = nodes.filter((n) => existingTargetNodeIds.has(n.id));

        if (existingTargetNodes.length) {
          // Position based on existing target nodes
          const minTargetX = Math.min(...existingTargetNodes.map((n) => n.position.x));
          const maxTargetY = Math.max(...existingTargetNodes.map((n) => n.position.y + (n.measured?.height ?? 100)));

          newPosition = {
            x: minTargetX,
            y: maxTargetY + 40,
          };
        } else {
          // First connection - position based on source nodes
          const avgSourceX = sourceNodes.reduce((sum, n) => sum + n.position.x, 0) / sourceNodes.length;
          const maxSourceY = Math.max(...sourceNodes.map((n) => n.position.y + (n.measured?.height ?? 100)));

          newPosition = {
            x: avgSourceX + 200, // Offset to the right of source nodes
            y: maxSourceY + 40,
          };
        }
      } else {
        // Default position if no source nodes
        newPosition = {
          x: Math.max(...nodes.map((n) => n.position.x), 0) + 200,
          y: Math.max(...nodes.map((n) => n.position.y), 0),
        };
        needSetCenter = true;
      }

      const enrichedData = {
        createdAt: new Date().toISOString(),
        ...node.data,
        metadata: {
          ...getNodeDefaultMetadata(node.type),
          ...node?.data?.metadata,
        },
      };

      const newNode = prepareNodeData({
        type: node.type,
        data: enrichedData,
        position: newPosition,
        selected: true,
      });

      const yNodes = ydoc.getArray('nodes');
      const yEdges = ydoc.getArray('edges');

      ydoc.transact(() => {
        yNodes.delete(0, yNodes.length);
        yNodes.push(deduplicateNodes([...nodes, newNode]));

        if (connectTo?.length > 0) {
          const newEdges: Edge[] =
            sourceNodes?.map((sourceNode) => ({
              id: `edge-${genUniqueId()}`,
              source: sourceNode.id,
              target: newNode.id,
              style: EDGE_STYLES.default,
              type: 'default',
            })) ?? [];

          if (newEdges.length > 0) {
            yEdges.delete(0, yEdges.length);
            yEdges.push(deduplicateEdges([...edges, ...newEdges]));
          }
        }
      });

      if (needSetCenter) {
        setNodeCenter(newNode.id);
      }
    },
    [canvasId, ydoc, setSelectedNode],
  );

  const setMode = useCallback(
    (mode: 'hand' | 'pointer') => {
      setModeRaw(canvasId, mode);
    },
    [canvasId, setModeRaw],
  );

  return {
    nodes,
    edges,
    setSelectedNode,
    setSelectedNodeByEntity,
    deselectNode,
    deselectNodeByEntity,
    setNodeData,
    setNodeDataByEntity,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onLayout,
    addNode,
    mode,
    setMode,
    setCanvasTitle,
    setSelectedNodes,
    addSelectedNode,
    addSelectedNodeByEntity,
  };
};
