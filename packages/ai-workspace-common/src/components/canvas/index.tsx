import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Radio, Space } from 'antd';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Connection,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { NodePreview } from './node-preview';
import { nodeTypes, prepareNodeData, CanvasNodeType, CanvasNode } from './node';
import { useCollabProvider } from '@refly-packages/ai-workspace-common/hooks/use-collab-provider';

import '@xyflow/react/dist/style.css';

export const Canvas = (props: { canvasId: string }) => {
  const { canvasId } = props;

  const navigate = useNavigate();

  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const [nodeType, setNodeType] = useState<CanvasNodeType>('skill');

  const collabProvider = useCollabProvider(canvasId);
  const ydoc = collabProvider.document;

  const yNodes = ydoc.getArray<CanvasNode>('nodes');
  const yEdges = ydoc.getArray<Edge>('edges');

  useEffect(() => {
    setNodes(yNodes.toJSON());
    setEdges(yEdges.toJSON());

    yNodes.observe(() => {
      setNodes(yNodes.toJSON());
    });

    yEdges.observe(() => {
      setEdges(yEdges.toJSON());
    });

    return () => {
      collabProvider.forceSync();
      collabProvider.destroy();
    };
  }, [canvasId, collabProvider]);

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

  const [message, setMessage] = useState('');
  // Add state for selected node
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);

  // Update the onConnect handler to use y-doc
  const onConnect = useCallback(
    (params: Connection) => {
      ydoc.transact(() => {
        const newEdge = { ...params, id: `edge-${params.source}-${params.target}` };
        yEdges.push([newEdge]);
      });
    },
    [ydoc, yEdges],
  );

  // Add node click handler
  const onNodeClick = useCallback((event: React.MouseEvent, node: CanvasNode) => {
    setSelectedNode(node);
  }, []);

  // Add panel close handler
  const handleClosePanel = () => {
    setSelectedNode(null);
  };

  // Update the handleSubmit function where we create new edges
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newNode = prepareNodeData({
      data: { entityId: message, metadata: {} },
      type: nodeType,
    });

    ydoc.transact(() => {
      yNodes.push([newNode]);

      // If there are existing nodes, create an edge from the last node to the new node
      if (nodes.length > 0) {
        const lastNode = nodes[nodes.length - 1];
        const newEdge = {
          id: `edge-${lastNode.id}-${newNode.id}`,
          source: lastNode.id,
          target: newNode.id,
          style: { stroke: '#666' },
        };
        yEdges.push([newEdge]);
      }
    });

    setMessage('');
  };

  return (
    <div className="w-screen h-screen relative">
      <Button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-10 px-4 py-2 bg-white rounded-md shadow-md hover:bg-gray-100 transition-colors"
      >
        ← Back
      </Button>

      <ReactFlow
        panOnScroll
        fitView
        selectionOnDrag
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
      >
        <Background />
        <Controls />
        <MiniMap position="top-right" />
      </ReactFlow>

      <form onSubmit={handleSubmit} className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl">
        <div className="relative">
          <Radio.Group className="mb-2" value={nodeType} onChange={(e) => setNodeType(e.target.value)}>
            <Radio.Button value="skill">Skill</Radio.Button>
            <Radio.Button value="document">Document</Radio.Button>
            <Radio.Button value="resource">Resource</Radio.Button>
            <Radio.Button value="tool">Tool</Radio.Button>
            <Radio.Button value="response">Response</Radio.Button>
          </Radio.Group>
          <Space.Compact style={{ width: '100%' }}>
            <Input value={message} onChange={(e) => setMessage(e.target.value)} onPressEnter={handleSubmit} />
            <Button type="primary" onClick={handleSubmit}>
              Submit
            </Button>
          </Space.Compact>
        </div>
      </form>

      {selectedNode && <NodePreview node={selectedNode} handleClosePanel={handleClosePanel} />}
    </div>
  );
};
