import { useCallback } from 'react';
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
import { useDebouncedCallback } from 'use-debounce';

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

  const { data, setNodes, setEdges, setTitleRaw, setModeRaw } = useCanvasStoreShallow((state) => ({
    data: state.data,
    setNodes: state.setNodes,
    setEdges: state.setEdges,
    setTitleRaw: state.setTitle,
    setModeRaw: state.setMode,
  }));

  const syncTitleToYDoc = useCallback((title: string) => {
    ydoc?.transact(() => {
      const yTitle = ydoc?.getText('title');
      yTitle?.delete(0, yTitle?.length ?? 0);
      yTitle?.insert(0, title);
    });
  }, []);

  const setTitle = useCallback(
    (title: string) => {
      setTitleRaw(canvasId, title);
      syncTitleToYDoc(title);
    },
    [canvasId, setTitleRaw, syncTitleToYDoc],
  );

  const syncNodesToYDoc = useDebouncedCallback((nodes: CanvasNode<any>[]) => {
    ydoc?.transact(() => {
      const yNodes = ydoc?.getArray('nodes');
      yNodes?.delete(0, yNodes?.length ?? 0);
      yNodes?.push(nodes);
    });
  }, 100);

  const syncEdgesToYDoc = useDebouncedCallback((edges: Edge[]) => {
    ydoc?.transact(() => {
      const yEdges = ydoc?.getArray('edges');
      yEdges?.delete(0, yEdges?.length ?? 0);
      yEdges?.push(edges);
    });
  }, 100);

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
      const { type, entityId } = filter;
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];
      const node = nodes.find((n) => n.type === type && n.data?.entityId === entityId);
      if (node) {
        deselectNode(node);
      }
    },
    [deselectNode],
  );

  const setNodeData = useCallback(
    <T = any>(nodeId: string, nodeData: Partial<CanvasNodeData<T>>) => {
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];
      const updatedNodes = nodes.map((n) => ({
        ...n,
        data: n.id === nodeId ? { ...n.data, ...nodeData } : n.data,
      }));
      setNodes(canvasId, updatedNodes);
    },
    [canvasId, setNodes],
  );

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

  const { fitView, setCenter, getNode } = useReactFlow();

  const onLayout = useCallback(
    (direction: 'TB' | 'LR') => {
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];
      const edges = data[canvasId]?.edges ?? [];
      const layouted = getLayoutedElements(nodes, edges, { direction });

      setNodes(canvasId, layouted.nodes);
      setEdges(canvasId, layouted.edges);
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
    [canvasId, fitView],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<CanvasNode<any>>[]) => {
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];
      const updatedNodes = applyNodeChanges(changes, nodes);
      setNodes(canvasId, updatedNodes);
      syncNodesToYDoc(updatedNodes);
    },
    [canvasId, setNodes, syncNodesToYDoc],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      const { data } = useCanvasStore.getState();
      const edges = data[canvasId]?.edges ?? [];
      const updatedEdges = applyEdgeChanges(changes, edges);
      setEdges(canvasId, updatedEdges);
      syncEdgesToYDoc(updatedEdges);
    },
    [canvasId, setEdges, syncEdgesToYDoc],
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
        style: EDGE_STYLES.default,
      };

      const { data } = useCanvasStore.getState();
      const edges = data[canvasId]?.edges ?? [];
      const updatedEdges = [...edges, newEdge];
      setEdges(canvasId, updatedEdges);
      syncEdgesToYDoc(updatedEdges);
    },
    [canvasId, setEdges, syncEdgesToYDoc],
  );

  const addNode = useCallback(
    (
      node: { type: CanvasNodeType; data: CanvasNodeData<any>; position?: XYPosition },
      connectTo?: CanvasNodeFilter[],
    ) => {
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];
      const edges = data[canvasId]?.edges ?? [];

      const currentNodes = nodes;

      if (!node?.type || !node?.data) {
        console.warn('Invalid node data provided');
        return;
      }

      // Check if node with the same entity already exists
      if (currentNodes.find((n) => n.type === node.type && n.data?.entityId === node.data?.entityId)) {
        message.warning(t('canvas.action.nodeAlreadyExists', { type: t(`common.${node.type}`) }));
        setSelectedNode(currentNodes.find((n) => n.type === node.type && n.data?.entityId === node.data?.entityId));
        return;
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
        position: node.position ?? {
          x: Math.max(...currentNodes.map((n) => n.position.x), 0) + 200,
          y: Math.max(...currentNodes.map((n) => n.position.y), 0),
        },
        selected: true,
      });

      const updatedNodes = [...currentNodes, newNode];
      setNodes(canvasId, updatedNodes);

      if (connectTo?.length > 0) {
        const newEdges: Edge[] = connectTo
          .map((filter) => {
            const sourceNode = currentNodes.find((n) => n.type === filter.type && n.data?.entityId === filter.entityId);
            if (sourceNode) {
              return {
                id: `edge-${genUniqueId()}`,
                source: sourceNode.id,
                target: newNode.id,
                style: EDGE_STYLES.default,
                type: 'default',
              };
            }
            return null;
          })
          .filter(Boolean);

        if (newEdges.length > 0) {
          const updatedEdges = [...edges, ...newEdges];
          setEdges(canvasId, updatedEdges);
        }
      }

      // Use RAF for layout and centering
      // requestAnimationFrame(() => {
      // onLayout('LR');

      // requestAnimationFrame(() => {
      //   const node = getNode(newNode.id);
      //   if (node) {
      //     setCenter(node.position.x, node.position.y, {
      //       duration: 500,
      //       zoom: 1,
      //     });
      //   }
      // });
      // });
    },
    [canvasId, setNodes, setEdges],
  );

  const nodes = data[canvasId]?.nodes ?? [];
  const edges = data[canvasId]?.edges ?? [];
  const mode = data[canvasId]?.mode ?? 'hand';

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
    setTitle,
    setSelectedNodes,
    addSelectedNode,
    addSelectedNodeByEntity,
  };
};
