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
import { TopToolbar } from './top-toolbar';
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
      <div className="w-screen h-screen relative flex flex-col">
        <CanvasToolbar onToolSelect={handleToolSelect} />
        <TopToolbar />
        <div className="flex-grow">
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
            <MiniMap
              position="bottom-left"
              style={{
                border: '1px solid rgba(16, 24, 40, 0.0784)',
                boxShadow: '0px 4px 6px 0px rgba(16, 24, 40, 0.03)',
              }}
              className="bg-white/80 w-[140px] h-[92px] mb-[50px] ml-[10px] rounded-lg shadow-md p-2 [&>svg]:w-full [&>svg]:h-full"
              // zoomable
              // pannable
              // maskColor="rgb(0, 0, 0, 0.1)"
              // nodeColor="#333"
              // nodeStrokeWidth={3}
            />
            <Controls
              position="bottom-left"
              style={{
                marginBottom: '12px',
                marginLeft: '10px',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '2px',
                padding: '2px',
                border: '1px solid rgba(16, 24, 40, 0.0784)',
                boxShadow: '0px 4px 6px 0px rgba(16, 24, 40, 0.03)',
                backgroundColor: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                height: '36px',
              }}
              className="[&>button]:border-0 [&>button]:border-r [&>button]:border-gray-200 [&>button:last-child]:border-0 [&>button]:w-[32px] [&>button]:h-[32px] [&>button]:rounded-lg [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:transition-colors [&>button]:duration-200"
              showZoom={true}
              showFitView={true}
              showInteractive={true}
            />
          </ReactFlow>
        </div>
        <div className="absolute bottom-[12px] left-1/2 -translate-x-1/2 w-[444px]">
          <CopilotOperationModule source={MessageIntentSource.Canvas} />
        </div>
      </div>
    </CanvasProvider>
  );
};
