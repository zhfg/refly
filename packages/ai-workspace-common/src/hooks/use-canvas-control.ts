import { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Connection, useReactFlow, XYPosition } from '@xyflow/react';
import Dagre from '@dagrejs/dagre';
import { CanvasNodeType } from '@refly/openapi-schema';
import { applyEdgeChanges, applyNodeChanges, Edge, EdgeChange, NodeChange } from '@xyflow/react';
import { CanvasNode, prepareNodeData } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { useCanvasStore, useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { CanvasNodeData, getNodeDefaultMetadata } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';
import { getEdgeStyles, useEdgeStyles } from '../components/canvas/constants';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { genUniqueId } from '@refly-packages/utils/id';
import { useThrottledCallback } from 'use-debounce';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useAddNode } from './use-add-node';

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
      width: node.measured?.width ?? 288,
      height: node.measured?.height ?? 320,
    }),
  );

  Dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = g.node(node.id);
      return {
        ...node,
        position: { x: nodeWithPosition.x, y: nodeWithPosition.y },
      };
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

export const useSetNodeDataByEntity = () => {
  const { canvasId: contextCanvasId, provider } = useCanvasContext();
  const { canvasId: routeCanvasId } = useParams();
  const ydoc = provider.document;

  const { setNodes } = useCanvasStoreShallow((state) => ({
    setNodes: state.setNodes,
  }));

  const syncNodesToYDoc = useCallback(
    (nodes: CanvasNode<any>[]) => {
      ydoc?.transact(() => {
        const yNodes = ydoc?.getArray('nodes');
        yNodes?.delete(0, yNodes?.length ?? 0);
        yNodes?.push(nodes);
      });
    },
    [ydoc],
  );

  return useCallback(
    <T = any>(filter: CanvasNodeFilter, nodeData: Partial<CanvasNodeData<T>>, selectedCanvasId?: string) => {
      const canvasId = selectedCanvasId ?? contextCanvasId ?? routeCanvasId;
      const currentNodes = useCanvasStore.getState().data[canvasId]?.nodes ?? [];
      const node = currentNodes.find((n) => n.type === filter.type && n.data?.entityId === filter.entityId);

      if (node) {
        const updatedNodes = currentNodes.map((n) => ({
          ...n,
          data:
            n.id === node.id
              ? {
                  ...n.data,
                  ...nodeData,
                  metadata: {
                    ...n.data?.metadata,
                    ...nodeData?.metadata,
                  },
                }
              : n.data,
        }));
        setNodes(canvasId, updatedNodes);
        syncNodesToYDoc(updatedNodes);
      }
    },
    [contextCanvasId, routeCanvasId, setNodes, syncNodesToYDoc],
  );
};

export const useCanvasControl = (selectedCanvasId?: string) => {
  const { canvasId: contextCanvasId, provider } = useCanvasContext();
  const ydoc = provider.document;

  const { t } = useTranslation();

  const { canvasId: routeCanvasId } = useParams();
  const canvasId = selectedCanvasId ?? contextCanvasId ?? routeCanvasId;

  // Get all store actions and data in one subscription
  const { data, setNodes, setEdges, setTitle, addPinnedNode, removePinnedNode } = useCanvasStoreShallow((state) => ({
    data: state.data,
    setNodes: state.setNodes,
    setEdges: state.setEdges,
    setTitle: state.setTitle,
    addPinnedNode: state.addPinnedNode,
    removePinnedNode: state.removePinnedNode,
  }));

  const edgeStyles = useEdgeStyles();

  const nodes = data[canvasId]?.nodes ?? [];
  const edges = data[canvasId]?.edges ?? [];

  // Memoize sync functions
  const syncFunctions = useMemo(() => {
    const syncTitleToYDoc = (title: string) => {
      ydoc?.transact(() => {
        const yTitle = ydoc?.getText('title');
        yTitle?.delete(0, yTitle?.length ?? 0);
        yTitle?.insert(0, title);
      });
    };

    const syncNodesToYDoc = (nodes: CanvasNode<any>[]) => {
      ydoc?.transact(() => {
        const yNodes = ydoc?.getArray('nodes');
        yNodes?.delete(0, yNodes?.length ?? 0);
        yNodes?.push(nodes);
      });
    };

    const syncEdgesToYDoc = (edges: Edge[]) => {
      ydoc?.transact(() => {
        const yEdges = ydoc?.getArray('edges');
        yEdges?.delete(0, yEdges?.length ?? 0);
        yEdges?.push(edges);
      });
    };

    return {
      syncTitleToYDoc,
      syncNodesToYDoc,
      syncEdgesToYDoc,
    };
  }, [ydoc]);

  const throttledSyncNodesToYDoc = useThrottledCallback(syncFunctions.syncNodesToYDoc, 500, {
    leading: true,
    trailing: false,
  });

  const throttledSyncEdgesToYDoc = useThrottledCallback(syncFunctions.syncEdgesToYDoc, 500, {
    leading: true,
    trailing: false,
  });

  // Memoize node operations
  const nodeOperations = useMemo(() => {
    const setNodeData = <T = any>(nodeId: string, nodeData: Partial<CanvasNodeData<T>>) => {
      const currentNodes = useCanvasStore.getState().data[canvasId]?.nodes ?? [];
      const updatedNodes = currentNodes.map((n) => ({
        ...n,
        data: n.id === nodeId ? { ...n.data, ...nodeData } : n.data,
      }));
      setNodes(canvasId, updatedNodes);
      syncFunctions.syncNodesToYDoc(updatedNodes);
    };

    return {
      setNodeData,
    };
  }, [canvasId, setNodes, syncFunctions]);

  const syncTitleToYDoc = useCallback(
    (title: string) => {
      ydoc?.transact(() => {
        const yTitle = ydoc?.getText('title');
        yTitle?.delete(0, yTitle?.length ?? 0);
        yTitle?.insert(0, title);
      });
    },
    [ydoc],
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

  const setSelectedNodes = useCallback(
    (selectedNodes: CanvasNode<any>[]) => {
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];
      const updatedNodes = nodes.map((n) => ({
        ...n,
        selected: selectedNodes.some((node) => node.id === n.id),
      }));
      setNodes(canvasId, updatedNodes);
    },
    [canvasId, setNodes],
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

  const { fitView, getNode, setCenter } = useReactFlow();

  const onLayout = useCallback(
    (direction: 'TB' | 'LR') => {
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];
      const edges = data[canvasId]?.edges ?? [];
      const layouted = getLayoutedElements(nodes, edges, { direction });

      setNodes(canvasId, layouted.nodes);
      setEdges(canvasId, layouted.edges);
      syncFunctions.syncNodesToYDoc(layouted.nodes);
      syncFunctions.syncEdgesToYDoc(layouted.edges);

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

  const onNodesChange = useCallback(
    (changes: NodeChange<CanvasNode<any>>[]) => {
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];
      const mutableNodes = nodes.map((node) => ({
        ...node,
        measured: node.measured ? { ...node.measured } : undefined,
      }));

      // Handle deleted nodes
      const deletedNodes = changes.filter((change) => change.type === 'remove');

      if (deletedNodes.length > 0) {
        const contextStore = useContextPanelStore.getState();

        deletedNodes.forEach((change) => {
          const nodeId = change.id;
          // Remove from context items
          contextStore.removeContextItem(nodeId);
          // Remove from chat history
          contextStore.removeHistoryItem(nodeId);
          // Remove from pinned nodes
          removePinnedNode(canvasId, nodeId);
        });
      }

      const updatedNodes = applyNodeChanges(changes, mutableNodes);
      setNodes(canvasId, updatedNodes);
      throttledSyncNodesToYDoc(updatedNodes);
    },
    [canvasId],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      const { data } = useCanvasStore.getState();
      const edges = data[canvasId]?.edges ?? [];
      const updatedEdges = applyEdgeChanges(changes, edges);
      setEdges(canvasId, updatedEdges);
      throttledSyncEdgesToYDoc(updatedEdges);
    },
    [canvasId, setEdges, throttledSyncEdgesToYDoc],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params?.source || !params?.target) {
        console.warn('Invalid connection parameters');
        return;
      }

      const newEdge = {
        ...params,
        id: `edge-${genUniqueId()}`,
        animated: false,
        style: edgeStyles.default,
      };

      const { data } = useCanvasStore.getState();
      const edges = data[canvasId]?.edges ?? [];
      const updatedEdges = [...edges, newEdge];
      setEdges(canvasId, updatedEdges);
      syncFunctions.syncEdgesToYDoc(updatedEdges);
    },
    [canvasId, setEdges, syncFunctions, edgeStyles],
  );

  const setNodeCenter = useCallback(
    (nodeId: string) => {
      // Center view on new node after it's rendered
      requestAnimationFrame(() => {
        const renderedNode = getNode(nodeId);
        if (renderedNode) {
          setCenter(renderedNode.position.x, renderedNode.position.y, {
            duration: 300,
            zoom: 1,
          });
        }
      });
    },
    [setCenter],
  );

  const { addNode } = useAddNode(canvasId);

  const updateAllEdgesStyle = useCallback(
    (showEdges: boolean) => {
      const { data } = useCanvasStore.getState();
      const edges = data[canvasId]?.edges ?? [];

      const updatedEdges = edges.map((edge) => ({
        ...edge,
        style: getEdgeStyles(showEdges)?.default,
      }));

      setEdges(canvasId, updatedEdges);
      syncFunctions.syncEdgesToYDoc(updatedEdges);
    },
    [canvasId, setEdges, syncFunctions],
  );

  return {
    nodes,
    edges,
    setSelectedNode,
    setSelectedNodeByEntity,
    deselectNode,
    deselectNodeByEntity,
    setNodeData: nodeOperations.setNodeData,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onLayout,
    addNode,
    setCanvasTitle: syncFunctions.syncTitleToYDoc,
    setNodeCenter,
    setSelectedNodes,
    addSelectedNode,
    addSelectedNodeByEntity,
    updateAllEdgesStyle,
  };
};

export const useNodeHoverEffect = (nodeId: string) => {
  const { setEdges, setNodes } = useReactFlow();
  const edgeStyles = useEdgeStyles();

  const updateNodeAndEdges = useCallback(
    (isHovered: boolean) => {
      // Batch update both nodes and edges in a single React state update
      const newZIndex = isHovered ? 1000 : 0;
      const newEdgeStyle = isHovered ? edgeStyles.hover : edgeStyles.default;

      setNodes((nodes) => nodes.map((node) => (node.id === nodeId ? { ...node, zIndex: newZIndex } : node)));

      setEdges((eds) =>
        eds.map((edge) => (edge.source === nodeId || edge.target === nodeId ? { ...edge, style: newEdgeStyle } : edge)),
      );
    },
    [nodeId, setEdges, setNodes, edgeStyles],
  );

  const handleMouseEnter = useCallback(() => {
    updateNodeAndEdges(true);
  }, [updateNodeAndEdges]);

  const handleMouseLeave = useCallback(() => {
    updateNodeAndEdges(false);
  }, [updateNodeAndEdges]);

  return {
    handleMouseEnter,
    handleMouseLeave,
  };
};
