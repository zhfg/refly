import { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  Node,
  SelectionMode,
  useReactFlow,
} from '@xyflow/react';
import { nodeTypes, CanvasNode } from './nodes';
import { LaunchPad } from './launchpad';
import { CanvasToolbar } from './canvas-toolbar';
import { TopToolbar } from './top-toolbar';
import { NodePreview } from './node-preview';

import '@xyflow/react/dist/style.css';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { CanvasProvider } from '@refly-packages/ai-workspace-common/context/canvas';
import { EDGE_STYLES } from './constants';
import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { CanvasListModal } from '@refly-packages/ai-workspace-common/components/workspace/canvas-list-modal';
import { LibraryModal } from '@refly-packages/ai-workspace-common/components/workspace/library-modal';
import { useCanvasNodesStore } from '@refly-packages/ai-workspace-common/stores/canvas-nodes';

const selectionStyles = `
  .react-flow__selection {
    background: rgba(0, 150, 143, 0.03) !important;
    border: 0.5px solid #00968F !important;
  }
  
  .react-flow__nodesselection-rect {
    background: rgba(0, 150, 143, 0.03) !important;
    border: 0.5px solid #00968F !important;
  }
`;

const Flow = ({ canvasId }: { canvasId: string }) => {
  const { nodes, edges, mode, setSelectedNode, onNodesChange, onEdgesChange, onConnect, onSelectionChange, addNode } =
    useCanvasControl(canvasId);

  const { pinnedNodes, showPreview } = useCanvasStoreShallow((state) => ({
    pinnedNodes: state.data[canvasId]?.pinnedNodes,
    showPreview: state.showPreview,
  }));

  const { showCanvasListModal, showLibraryModal, setShowCanvasListModal, setShowLibraryModal } = useSiderStoreShallow(
    (state) => ({
      showCanvasListModal: state.showCanvasListModal,
      showLibraryModal: state.showLibraryModal,
      setShowCanvasListModal: state.setShowCanvasListModal,
      setShowLibraryModal: state.setShowLibraryModal,
    }),
  );

  const reactFlowInstance = useReactFlow();

  const { pendingNode, clearPendingNode } = useCanvasNodesStore();

  useEffect(() => {
    // Only run fitView if we have nodes and this is the initial render
    const timeoutId = setTimeout(() => {
      if (nodes?.length > 0) {
        reactFlowInstance.fitView({
          padding: 0.2,
          duration: 200,
          minZoom: 0.1,
          maxZoom: 2,
        });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []); // Run only once on mount

  const defaultEdgeOptions = {
    style: EDGE_STYLES.default,
  };

  const defaultViewport = {
    x: 0,
    y: 0,
    zoom: 0.75,
  };

  const flowConfig = useMemo(
    () => ({
      defaultViewport,
      fitViewOptions: {
        padding: 0.2,
        minZoom: 0.1,
        maxZoom: 2,
        duration: 200,
      },
      defaultEdgeOptions,
    }),
    [],
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: CanvasNode<any>) => {
      if (!node?.id) {
        console.warn('Invalid node clicked');
        return;
      }
      setSelectedNode(node);
    },
    [setSelectedNode],
  );

  const selectedNodes = nodes?.filter((node) => node.selected);

  const isPinned = (node: CanvasNode<any>) => {
    return pinnedNodes?.some((n) => n.id === node.id);
  };

  const isSelected = (node: CanvasNode<any>) => {
    return selectedNodes?.some((n) => n.id === node.id);
  };

  const handleToolSelect = (tool: string) => {
    // Handle tool selection
    console.log('Selected tool:', tool);
  };

  // Handle pending node
  useEffect(() => {
    if (pendingNode) {
      addNode(pendingNode);
      clearPendingNode();
    }
  }, [pendingNode, addNode, setSelectedNode, clearPendingNode]);

  return (
    <div className="w-full h-screen relative flex flex-col overflow-hidden">
      <CanvasToolbar onToolSelect={handleToolSelect} />
      <TopToolbar canvasId={canvasId} />
      <div className="flex-grow relative">
        <style>{selectionStyles}</style>
        <ReactFlow
          {...flowConfig}
          panOnScroll={mode !== 'pointer'}
          selectNodesOnDrag={mode === 'pointer'}
          selectionMode={mode === 'pointer' ? SelectionMode.Partial : SelectionMode.Full}
          selectionOnDrag={mode === 'pointer'}
          panOnDrag={mode !== 'pointer'}
          nodeTypes={nodeTypes}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeDragThreshold={10}
          // onSelectionChange={onSelectionChange}
        >
          <Background />
          <MiniMap
            position="bottom-left"
            style={{
              border: '1px solid rgba(16, 24, 40, 0.0784)',
              boxShadow: '0px 4px 6px 0px rgba(16, 24, 40, 0.03)',
            }}
            className="bg-white/80 w-[140px] h-[92px] !mb-[46px] !ml-[10px] rounded-lg shadow-md p-2 [&>svg]:w-full [&>svg]:h-full"
            // zoomable
            // pannable
            // maskColor="rgb(0, 0, 0, 0.1)"
            // nodeColor="#333"
            // nodeStrokeWidth={3}
          />
          <Controls
            position="bottom-left"
            style={{
              marginBottom: '8px',
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
            fitViewOptions={{
              padding: 10,
              minZoom: 0.1,
              maxZoom: 2,
              duration: 200,
            }}
          />
        </ReactFlow>

        <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 w-[444px] z-10">
          <LaunchPad />
        </div>
      </div>

      {showPreview && (
        <div className="absolute top-0 bottom-0 right-2 overflow-x-auto max-w-[900px]">
          <div className="flex gap-2">
            {selectedNodes?.map((node) =>
              isPinned(node) ? null : (
                <NodePreview
                  key={node.id}
                  node={node}
                  canvasId={canvasId}
                  isPinned={isPinned(node)}
                  selected={isSelected(node)}
                />
              ),
            )}

            {pinnedNodes?.map((node) => (
              <NodePreview
                key={node.id}
                node={node}
                canvasId={canvasId}
                isPinned={isPinned(node)}
                selected={isSelected(node)}
              />
            ))}
          </div>
        </div>
      )}

      <CanvasListModal visible={showCanvasListModal} setVisible={setShowCanvasListModal} />
      <LibraryModal visible={showLibraryModal} setVisible={setShowLibraryModal} />
    </div>
  );
};

export const Canvas = (props: { canvasId: string }) => {
  const { canvasId } = props;

  useEffect(() => {
    if (canvasId && canvasId !== 'empty') {
      localStorage.setItem('currentCanvasId', canvasId);
    } else {
      localStorage.removeItem('currentCanvasId');
    }
  }, [canvasId]);

  return (
    <CanvasProvider canvasId={canvasId}>
      <ReactFlowProvider>
        <Flow canvasId={canvasId} />
      </ReactFlowProvider>
    </CanvasProvider>
  );
};
