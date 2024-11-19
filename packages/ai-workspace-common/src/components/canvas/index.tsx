import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { useCookie } from 'react-use';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  Connection,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { HocuspocusProvider } from '@hocuspocus/provider';

import '@xyflow/react/dist/style.css';
import { PreviewPanel } from './preview-panel';
import { getWsServerOrigin } from '@refly-packages/utils/url';

export const Canvas = (props: { canvasId: string }) => {
  const { canvasId } = props;

  const navigate = useNavigate();

  const [token] = useCookie('_refly_ai_sid');

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const websocketProvider = useMemo(() => {
    const provider = new HocuspocusProvider({
      url: getWsServerOrigin(),
      name: canvasId,
      token,
    });
    provider.on('status', (event) => {
      console.log('websocketProvider event', event);
    });
    return provider;
  }, [canvasId, token]);
  const ydoc = websocketProvider.document;

  const yNodes = ydoc.getArray<Node>('nodes');
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
      websocketProvider.destroy();
    };
  }, [canvasId, websocketProvider]);

  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
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
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

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
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('node', node);
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

    const newNode = {
      id: `node-${Date.now()}`,
      position: {
        x: Math.random() * 500,
        y: Math.random() * 500,
      },
      data: { label: message },
      style: {
        background: '#fff',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #ddd',
      },
    };

    ydoc.transact(() => {
      yNodes.push([newNode]);

      // If there are existing nodes, create an edge from the last node to the new node
      if (nodes.length > 0) {
        const lastNode = nodes[nodes.length - 1];
        const newEdge = {
          id: `edge-${lastNode.id}-${newNode.id}`,
          source: lastNode.id,
          target: newNode.id,
          style: { stroke: '#999' },
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

      <form onSubmit={handleSubmit} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl">
        <div className="relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </div>
      </form>

      {selectedNode && (
        <div className="absolute top-1 right-4 w-96 h-[95%] m-3 bg-white rounded-lg shadow-lg p-4 z-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Node Preview</h3>
            <button onClick={handleClosePanel} className="text-gray-500 hover:text-gray-700">
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div className="bg-gray-50 rounded p-3">
            <p className="text-gray-800">{JSON.stringify(selectedNode.data)}</p>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <p>Node ID: {selectedNode.id}</p>
            <p>
              Position: ({Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)})
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
