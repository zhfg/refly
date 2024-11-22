import { useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Connection } from '@xyflow/react';
import { CanvasNodeType } from '@refly/openapi-schema';
import { applyEdgeChanges, applyNodeChanges, Edge, EdgeChange, NodeChange } from '@xyflow/react';
import { CanvasNode, prepareNodeData } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { useCanvasStore, useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { CanvasNodeData, getNodeDefaultMetadata } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';

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

  const addNode = (node: { type: CanvasNodeType; data: CanvasNodeData }) => {
    const { nodes } = useCanvasStore.getState().data[canvasId];

    if (!node?.type || !node?.data) {
      console.warn('Invalid node data provided');
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
      if (nodes?.length > 0) {
        const lastNode = nodes[nodes.length - 1];
        if (lastNode?.id && newNode?.id) {
          const newEdge = {
            id: `edge-${lastNode.id}-${newNode.id}`,
            source: lastNode.id,
            target: newNode.id,
            style: { stroke: '#666' },
          };
          yEdges?.push([newEdge]);
        }
      }
    });

    setSelectedNodeRaw(canvasId, newNode);
  };

  return {
    nodes,
    edges,
    selectedNode,
    setSelectedNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
  };
};
