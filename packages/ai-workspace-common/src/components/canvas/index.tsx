import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Connection,
  Edge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { NodePreview } from './node-preview';
import {
  nodeTypes,
  prepareNodeData,
  CanvasNode,
  CanvasNodeData,
  DocumentNodeMeta,
  ResourceNodeMeta,
  SkillNodeMeta,
  ToolNodeMeta,
  ResponseNodeMeta,
} from './nodes';
import { CanvasNodeType } from '@refly/openapi-schema';
import { CanvasProvider } from './context-provider';
import { useCollabProvider } from '@refly-packages/ai-workspace-common/hooks/use-collab-provider';
import { CanvasToolbar } from './canvas-toolbar';
import { canvasEmitter } from '@refly-packages/ai-workspace-common/utils/event-emitter/canvas';

import '@xyflow/react/dist/style.css';
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';
import { CopilotOperationModule } from '@refly-packages/ai-workspace-common/components/copilot/copilot-operation-module';

export const Canvas = (props: { canvasId: string }) => {
  const { canvasId } = props;

  const navigate = useNavigate();

  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const collabProvider = useCollabProvider(canvasId);
  const ydoc = collabProvider.document;

  const yNodes = ydoc.getArray<CanvasNode>('nodes');
  const yEdges = ydoc.getArray<Edge>('edges');

  console.log('nodes', nodes);
  console.log('yNodes', yNodes.toJSON());
  console.log('edges', edges);
  console.log('yEdges', yEdges.toJSON());

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

  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);

  // Update the onConnect handler to use y-doc
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
          // Add additional edge properties with defaults
          animated: false,
          style: { stroke: '#666' },
        };
        yEdges?.push([newEdge]);
      });
    },
    [ydoc, yEdges],
  );

  // Add node click handler
  const onNodeClick = useCallback((event: React.MouseEvent, node: CanvasNode) => {
    if (!node?.id) {
      console.warn('Invalid node clicked');
      return;
    }
    setSelectedNode(node);
  }, []);

  // Add panel close handler
  const handleClosePanel = () => {
    setSelectedNode(null);
  };

  const handleToolSelect = (tool: string) => {
    // Handle tool selection
    console.log('Selected tool:', tool);
  };

  const handleAddNode = (node: { type: CanvasNodeType; data: CanvasNodeData }) => {
    // Add defensive programming for input validation
    if (!node?.type || !node?.data) {
      console.warn('Invalid node data provided');
      return;
    }

    // Add default metadata based on node type
    const enrichedData = {
      ...node.data,
      metadata: {
        ...node?.data?.metadata, // Use optional chaining
        ...getDefaultMetadata(node.type),
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

    setSelectedNode(newNode);
  };

  // Helper function to get default metadata based on node type
  const getDefaultMetadata = (nodeType: CanvasNodeType) => {
    if (!nodeType) {
      return {};
    }

    switch (nodeType) {
      case 'document':
        return {
          contentPreview: 'Loading document content...',
          // Add optional fields with default values
          title: '',
          lastModified: new Date().toISOString(),
        } as DocumentNodeMeta;

      case 'resource':
        return {
          resourceType: 'weblink', // Default to weblink
          url: '',
          description: '',
          lastAccessed: new Date().toISOString(),
        } as ResourceNodeMeta;

      case 'skill':
        return {
          query: '',
          skillType: 'prompt',
          model: 'gpt-4',
          parameters: {}, // Additional parameters if needed
          lastExecuted: null,
        } as SkillNodeMeta;

      case 'tool':
        return {
          toolType: 'TextToSpeech',
          configuration: {}, // Tool-specific configuration
          status: 'ready',
          lastUsed: null,
        } as ToolNodeMeta;

      case 'response':
        return {
          modelName: 'AI Assistant',
          timestamp: new Date().toISOString(),
          status: 'pending',
          executionTime: null,
        } as ResponseNodeMeta;

      default:
        return {};
    }
  };

  // Add defensive programming for useEffect
  useEffect(() => {
    if (!canvasEmitter) {
      console.warn('Canvas emitter not initialized');
      return;
    }

    canvasEmitter?.on('addNode', handleAddNode);
    return () => {
      canvasEmitter?.off('addNode', handleAddNode);
    };
  }, []);

  return (
    <CanvasProvider context={{ canvasId }}>
      <div className="w-screen h-screen relative">
        <Button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 z-10 px-4 py-2 bg-white rounded-md shadow-md hover:bg-gray-100 transition-colors"
        >
          ← Back
        </Button>

        <CanvasToolbar onToolSelect={handleToolSelect} />

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

        <div className="absolute bottom-4 h-48 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl">
          <CopilotOperationModule source={MessageIntentSource.Canvas} />
        </div>

        {selectedNode && <NodePreview node={selectedNode} handleClosePanel={handleClosePanel} />}
      </div>
    </CanvasProvider>
  );
};
