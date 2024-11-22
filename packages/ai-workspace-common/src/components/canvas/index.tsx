import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import { nodeTypes, CanvasNode } from './nodes';
import { CanvasToolbar } from './canvas-toolbar';
import { TopToolbar } from './top-toolbar';
import { NodePreview } from './node-preview';

import '@xyflow/react/dist/style.css';
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';
import { CopilotOperationModule } from '@refly-packages/ai-workspace-common/components/copilot/copilot-operation-module';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { CanvasProvider } from '@refly-packages/ai-workspace-common/context/canvas';

const Flow = ({ canvasId }: { canvasId: string }) => {
  const { nodes, edges, selectedNode, setSelectedNode, onNodesChange, onEdgesChange, onConnect } =
    useCanvasControl(canvasId);

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

  const navigate = useNavigate();

  const handleToolSelect = (tool: string) => {
    // Handle tool selection
    console.log('Selected tool:', tool);
  };

  return (
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

      {selectedNode && <NodePreview node={selectedNode} handleClosePanel={handleClosePanel} />}
    </div>
  );
};

export const Canvas = (props: { canvasId: string }) => {
  const { canvasId } = props;

  return (
    <CanvasProvider canvasId={canvasId}>
      <Flow canvasId={canvasId} />
    </CanvasProvider>
  );
};
