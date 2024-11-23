import { useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Connection, useReactFlow } from '@xyflow/react';
import Dagre from '@dagrejs/dagre';
import { CanvasNodeType } from '@refly/openapi-schema';
import { applyEdgeChanges, applyNodeChanges, Edge, EdgeChange, NodeChange } from '@xyflow/react';
import { CanvasNode, prepareNodeData } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { useCanvasStore, useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { CanvasNodeData, getNodeDefaultMetadata } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';

const getLayoutedElements = (nodes: CanvasNode[], edges: Edge[], options: { direction: 'TB' | 'LR' }) => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: options.direction });

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
  } = useCanvasStoreShallow((state) => ({
    data: state.data[canvasId],
    setNodes: state.setNodes,
    setEdges: state.setEdges,
    setSelectedNode: state.setSelectedNode,
  }));

  const { nodes, edges, selectedNode } = data ?? {
    nodes: [],
    edges: [],
    selectedNode: null,
  };

  const setSelectedNode = useCallback(
    (node: CanvasNode) => {
      setSelectedNodeRaw(canvasId, node);
    },
    [setSelectedNodeRaw, canvasId],
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

  const { fitView } = useReactFlow();

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

      // window.requestAnimationFrame(() => {
      //   fitView();
      // });
    },
    [canvasId],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<CanvasNode>[]) => {
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
          style: { stroke: '#666' },
        };
        yEdges?.push([newEdge]);
      });
    },
    [ydoc, yEdges],
  );

  const addNode = (node: { type: CanvasNodeType; data: CanvasNodeData }, connectTo?: CanvasNodeFilter[]) => {
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

    // Add default metadata based on node type
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

      // If there are existing nodes, create an edge from the last node to the new node
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
              style: { stroke: '#ccc' },
            });
          }
        });
        console.log('newEdges', newEdges);
        yEdges?.push(newEdges);
      }
    });

    window.requestAnimationFrame(() => {
      onLayout('LR');
    });

    setSelectedNode(newNode);
  };

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
  };
};
