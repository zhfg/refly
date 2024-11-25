import { useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Connection, useReactFlow, Node } from '@xyflow/react';
import Dagre from '@dagrejs/dagre';
import { CanvasNodeType } from '@refly/openapi-schema';
import { applyEdgeChanges, applyNodeChanges, Edge, EdgeChange, NodeChange } from '@xyflow/react';
import { CanvasNode, prepareNodeData } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { useCanvasStore, useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { CanvasNodeData, getNodeDefaultMetadata } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';
import { EDGE_STYLES } from '../components/canvas/constants';

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
  const { canvasId: contextCanvasId, provider, yNodes, yEdges } = useCanvasContext();
  const { canvasId: routeCanvasId } = useParams();
  const canvasId = selectedCanvasId ?? contextCanvasId ?? routeCanvasId;

  const {
    data,
    setNodes,
    setEdges,
    setSelectedNode: setSelectedNodeRaw,
    setMode: setModeRaw,
    setSelectedNodes: setSelectedNodesRaw,
  } = useCanvasStoreShallow((state) => ({
    data: state.data[canvasId],
    setNodes: state.setNodes,
    setEdges: state.setEdges,
    setSelectedNode: state.setSelectedNode,
    setMode: state.setMode,
    setSelectedNodes: state.setSelectedNodes,
  }));

  const { nodes, edges, selectedNode, mode, selectedNodes } = data ?? {
    nodes: [],
    edges: [],
    selectedNode: null,
    mode: 'hand',
    selectedNodes: [],
  };

  const setSelectedNode = useCallback(
    (node: CanvasNode<any> | null) => {
      setSelectedNodeRaw(canvasId, node);
    },
    [setSelectedNodeRaw, canvasId],
  );

  const setMode = useCallback(
    (newMode: 'pointer' | 'hand') => {
      setModeRaw(canvasId, newMode);
    },
    [setModeRaw, canvasId],
  );

  const setSelectedNodes = useCallback(
    (nodes: CanvasNode<any>[]) => {
      setSelectedNodesRaw(canvasId, nodes);
    },
    [setSelectedNodesRaw, canvasId],
  );

  const ydoc = provider.document;

  const observersSet = useRef(false);

  useEffect(() => {
    const nodesObserver = () => {
      setNodes(canvasId, yNodes.toJSON());
    };

    const edgesObserver = () => {
      setEdges(canvasId, yEdges.toJSON());
    };

    if (!observersSet.current) {
      setNodes(canvasId, yNodes.toJSON());
      setEdges(canvasId, yEdges.toJSON());

      yNodes.observe(nodesObserver);
      yEdges.observe(edgesObserver);

      observersSet.current = true;
    }

    return () => {
      if (observersSet.current) {
        yNodes.unobserve(nodesObserver);
        yEdges.unobserve(edgesObserver);
        observersSet.current = false;
      }
    };
  }, [canvasId]);

  const { fitView, getNodes, setNodes: setReactFlowNodes } = useReactFlow();

  const onLayout = useCallback(
    (direction: 'TB' | 'LR') => {
      const { nodes, edges } = useCanvasStore.getState().data[canvasId];
      const layouted = getLayoutedElements(nodes, edges, { direction });

      ydoc.transact(() => {
        yNodes.delete(0, yNodes.length);
        yNodes.push(layouted.nodes);
        yEdges.delete(0, yEdges.length);
        yEdges.push(layouted.edges);
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

  const onNodesChange = useCallback(
    (changes: NodeChange<CanvasNode<any>>[]) => {
      ydoc.transact(() => {
        const updatedNodes = applyNodeChanges(changes, yNodes.toJSON());
        yNodes.delete(0, yNodes.length);
        yNodes.push(updatedNodes);
      });
    },
    [ydoc, yNodes],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      ydoc.transact(() => {
        const updatedEdges = applyEdgeChanges(changes, yEdges.toJSON());
        yEdges.delete(0, yEdges.length);
        yEdges.push(updatedEdges);
      });
    },
    [ydoc, yEdges],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params?.source || !params?.target) {
        console.warn('Invalid connection parameters');
        return;
      }

      ydoc?.transact(() => {
        const newEdge = {
          ...params,
          id: `edge-${params.source}-${params.target}`,
          animated: false,
          style: EDGE_STYLES.default,
        };
        yEdges?.push([newEdge]);
      });
    },
    [ydoc, yEdges],
  );

  const addNode = (node: { type: CanvasNodeType; data: CanvasNodeData<any> }, connectTo?: CanvasNodeFilter[]) => {
    const { nodes } = useCanvasStore.getState().data[canvasId];

    if (!node?.type || !node?.data) {
      console.warn('Invalid node data provided');
      return;
    }

    // Check if a node with the same entity already exists
    if (nodes.find((n) => n.type === node.type && n.data?.entityId === node.data?.entityId)) {
      console.warn('Node with the same entity already exists');
      return;
    }

    const enrichedData = {
      ...node.data,
      metadata: {
        ...node?.data?.metadata,
        ...getNodeDefaultMetadata(node.type),
      },
    };

    const newNode = prepareNodeData({
      type: node.type,
      data: enrichedData,
    });

    ydoc?.transact(() => {
      yNodes?.push([newNode]);

      if (connectTo?.length > 0) {
        const newEdges: Edge[] = [];
        connectTo.forEach((filter) => {
          if (!filter.type || !filter.entityId) {
            console.warn('Invalid filter provided');
            return;
          }

          const targetNode = nodes.find((n) => n.type === filter.type && n.data?.entityId === filter.entityId);
          if (targetNode) {
            newEdges.push({
              id: `edge-${targetNode.id}-${newNode.id}`,
              source: targetNode.id,
              target: newNode.id,
              style: EDGE_STYLES.default,
            });
          }
        });
        yEdges?.push(newEdges);
      }
    });

    const currentNodes = getNodes();
    setReactFlowNodes(
      currentNodes.map((node) => ({
        ...node,
        selected: node.id === newNode.id,
      })),
    );

    setSelectedNode(newNode);

    setTimeout(() => {
      onLayout('LR');
    }, 50);
  };

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      // 过滤并转换节点类型
      const selectedCanvasNodes = selectedNodes.filter((node): node is CanvasNode<any> => {
        return (
          node.type !== undefined &&
          node.data !== undefined &&
          typeof node.data === 'object' &&
          'title' in node.data &&
          'entityId' in node.data
        );
      });

      // 如果只选中一个节点，同时更新 selectedNode
      if (selectedCanvasNodes.length === 1) {
        setSelectedNode(selectedCanvasNodes[0]);
      } else if (selectedCanvasNodes.length === 0) {
        // @ts-ignore - null is valid here
        setSelectedNode(null);
      }

      setSelectedNodes(selectedCanvasNodes);
    },
    [setSelectedNodes, setSelectedNode],
  );

  return {
    nodes,
    edges,
    selectedNode,
    setSelectedNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onLayout,
    addNode,
    mode,
    setMode,
    selectedNodes,
    setSelectedNodes,
    handleSelectionChange,
  };
};
