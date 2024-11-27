import { useEffect, useCallback, useRef } from 'react';
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
  const ydoc = provider.document;

  const { canvasId: routeCanvasId } = useParams();
  const canvasId = selectedCanvasId ?? contextCanvasId ?? routeCanvasId;

  const {
    data,
    setNodes,
    setEdges,
    setMode: setModeRaw,
  } = useCanvasStoreShallow((state) => ({
    data: state.data[canvasId],
    setNodes: state.setNodes,
    setEdges: state.setEdges,
    setMode: state.setMode,
    setSelectedNodes: state.setSelectedNodes,
  }));

  const { nodes = [], edges = [], mode = 'hand' } = data ?? {};

  const setMode = useCallback(
    (newMode: 'pointer' | 'hand') => {
      setModeRaw(canvasId, newMode);
    },
    [setModeRaw, canvasId],
  );

  const setSelectedNode = useCallback(
    (node: CanvasNode<any> | null) => {
      ydoc.transact(() => {
        yNodes.forEach((n) => {
          n.selected = n.id === node?.id;
        });
      });
    },
    [ydoc, yNodes],
  );

  const setSelectedNodeByEntity = useCallback(
    (filter: CanvasNodeFilter) => {
      const { type, entityId } = filter;
      const { nodes } = useCanvasStore.getState().data[canvasId];
      setSelectedNode(nodes.find((node) => node.type === type && node.data?.entityId === entityId));
    },
    [canvasId, setSelectedNode],
  );

  const setSelectedNodes = useCallback(
    (nodes: CanvasNode<any>[]) => {
      ydoc.transact(() => {
        yNodes.forEach((n) => {
          n.selected = nodes.some((node) => node.id === n.id);
        });
      });
    },
    [ydoc, yNodes],
  );

  const observersSet = useRef(false);

  useEffect(() => {
    if (!canvasId || !yNodes || !yEdges || observersSet.current) return;

    const nodesObserver = () => {
      setNodes(canvasId, yNodes.toJSON());
    };

    const edgesObserver = () => {
      setEdges(canvasId, yEdges.toJSON());
    };

    setNodes(canvasId, yNodes.toJSON());
    setEdges(canvasId, yEdges.toJSON());

    yNodes.observe(nodesObserver);
    yEdges.observe(edgesObserver);

    observersSet.current = true;

    return () => {
      yNodes.unobserve(nodesObserver);
      yEdges.unobserve(edgesObserver);
      observersSet.current = false;
    };
  }, [canvasId, yNodes, yEdges, setNodes, setEdges]);

  const { fitView, getNodes, setNodes: setReactFlowNodes, setCenter, getNode } = useReactFlow();

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

  const addNode = useCallback(
    (
      node: { type: CanvasNodeType; data: CanvasNodeData<any>; position?: XYPosition },
      connectTo?: CanvasNodeFilter[],
    ) => {
      const currentState = useCanvasStore.getState().data[canvasId];
      const currentNodes = currentState?.nodes ?? [];

      if (!node?.type || !node?.data) {
        console.warn('Invalid node data provided');
        return;
      }

      // Check if node with the same entity already exists
      if (currentNodes.find((n) => n.type === node.type && n.data?.entityId === node.data?.entityId)) {
        console.warn('Node with the same entity already exists');
        return;
      }

      const enrichedData = {
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

      // Use a single transaction for all updates
      ydoc?.transact(() => {
        yNodes?.push([newNode]);

        if (connectTo?.length > 0) {
          const newEdges: Edge[] = [];
          connectTo.forEach((filter) => {
            const sourceNode = currentNodes.find((n) => n.type === filter.type && n.data?.entityId === filter.entityId);

            if (sourceNode) {
              newEdges.push({
                id: `edge-${sourceNode.id}-${newNode.id}`,
                source: sourceNode.id,
                target: newNode.id,
                style: EDGE_STYLES.default,
                type: 'default',
              });
            }
          });

          if (newEdges.length > 0) {
            yEdges?.push(newEdges);
          }
        }
      });

      // Use RAF for layout and centering
      requestAnimationFrame(() => {
        onLayout('LR');

        requestAnimationFrame(() => {
          const node = getNode(newNode.id);
          if (node) {
            setCenter(node.position.x, node.position.y, {
              duration: 500,
              zoom: 1,
            });
          }
        });
      });
    },
    [canvasId, ydoc, yNodes, yEdges, onLayout, getNode, setCenter],
  );

  const onSelectionChange = useCallback(
    ({ nodes }: { nodes: Node[] }) => {
      ydoc.transact(() => {
        yNodes.delete(0, yNodes.length);
        yNodes.push(nodes as CanvasNode<any>[]);
      });
    },
    [ydoc, yNodes],
  );

  return {
    nodes,
    edges,
    setSelectedNode,
    setSelectedNodeByEntity,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onLayout,
    onSelectionChange,
    addNode,
    mode,
    setMode,
    setSelectedNodes,
  };
};
