import { useCallback, useMemo, useEffect, useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ReactFlow, Background, MiniMap, Node, Edge } from '@xyflow/react';
import { Button } from 'antd';
import { nodeTypes } from './nodes';
import { useEdgeStyles } from './constants';
import { Spin } from '@refly-packages/ai-workspace-common/components/common/spin';
import { locateToNodePreviewEmitter } from '@refly-packages/ai-workspace-common/events/locateToNodePreview';

import '@xyflow/react/dist/style.css';
import './index.scss';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { IconCreateDocument } from '@refly-packages/ai-workspace-common/components/common/icon';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

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

// Add new memoized components
const MemoizedBackground = memo(Background);
const MemoizedMiniMap = memo(MiniMap);

const Flow = memo(({ canvasId }: { canvasId: string }) => {
  const { t } = useTranslation();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const edgeStyles = useEdgeStyles();

  const interactionMode = useUserStore.getState().localSettings.canvasMode;

  const defaultEdgeOptions = useMemo(
    () => ({
      style: edgeStyles.default,
    }),
    [edgeStyles],
  );

  const flowConfig = useMemo(
    () => ({
      defaultViewport: {
        x: 0,
        y: 0,
        zoom: 0.75,
      },
      minZoom: 0.1,
      maxZoom: 2,
      fitViewOptions: {
        padding: 0.2,
        minZoom: 0.1,
        maxZoom: 2,
        duration: 200,
      },
      defaultEdgeOptions,
    }),
    [defaultEdgeOptions],
  );

  // Add scroll position state and handler
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(false);

  const updateIndicators = useCallback(
    (container: HTMLDivElement | null) => {
      if (!container) return;

      const shouldShowLeft = container.scrollLeft > 0;
      const shouldShowRight =
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1;

      if (shouldShowLeft !== showLeftIndicator) {
        setShowLeftIndicator(shouldShowLeft);
      }
      if (shouldShowRight !== showRightIndicator) {
        setShowRightIndicator(shouldShowRight);
      }
    },
    [showLeftIndicator, showRightIndicator],
  );

  useEffect(() => {
    const container = document.querySelector('.preview-container') as HTMLDivElement;
    if (container) {
      const observer = new ResizeObserver(() => {
        updateIndicators(container);
      });

      observer.observe(container);
      updateIndicators(container);

      return () => {
        observer.disconnect();
      };
    }
  }, [updateIndicators]);

  const getCanvasNodes = async () => {
    const { data } = await getClient().getCanvasData({
      query: {
        canvasId,
      },
    });
    console.log('data', data);
    if (data.data) {
      const { nodes, edges } = data.data;
      setNodes(nodes as Node[]);
      setEdges(edges as Edge[]);
    }
  };

  useEffect(() => {
    getCanvasNodes();
    const unsubscribe = locateToNodePreviewEmitter.on(
      'locateToNodePreview',
      ({ canvasId: emittedCanvasId, id }) => {
        if (emittedCanvasId === canvasId) {
          requestAnimationFrame(() => {
            const previewContainer = document.querySelector('.preview-container');
            const targetPreview = document.querySelector(`[data-preview-id="${id}"]`);

            if (previewContainer && targetPreview) {
              targetPreview.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
              });
            }
          });
        }
      },
    );

    return unsubscribe;
  }, [canvasId]);

  // Memoize nodes and edges
  const memoizedNodes = useMemo(() => nodes, [nodes]);
  const memoizedEdges = useMemo(() => edges, [edges]);

  // Memoize MiniMap styles
  const miniMapStyles = useMemo(
    () => ({
      border: '1px solid rgba(16, 24, 40, 0.0784)',
      boxShadow: '0px 4px 6px 0px rgba(16, 24, 40, 0.03)',
    }),
    [],
  );

  // Memoize the Background and MiniMap components
  const memoizedBackground = useMemo(() => <MemoizedBackground />, []);
  const memoizedMiniMap = useMemo(
    () => (
      <MemoizedMiniMap
        position="bottom-left"
        style={miniMapStyles}
        className="bg-white/80 w-[140px] h-[92px] !mb-[46px] !ml-[10px] rounded-lg shadow-md p-2 [&>svg]:w-full [&>svg]:h-full"
        zoomable={false}
        pannable={false}
      />
    ),
    [miniMapStyles],
  );

  // Memoize the node types configuration
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  return (
    <Spin
      className="w-full h-full"
      style={{ maxHeight: '100%' }}
      spinning={false}
      tip={t('common.loading')}
    >
      <div className="w-full h-screen relative flex flex-col overflow-hidden">
        {/* <CanvasToolbar onToolSelect={handleToolSelect} /> */}
        {/* <TopToolbar canvasId={canvasId} /> */}
        <div className="flex-grow relative">
          <style>{selectionStyles}</style>
          <ReactFlow
            {...flowConfig}
            panOnScroll={interactionMode === 'touchpad'}
            panOnDrag={interactionMode === 'mouse'}
            zoomOnScroll={interactionMode === 'mouse'}
            zoomOnPinch={interactionMode === 'touchpad'}
            zoomOnDoubleClick={false}
            selectNodesOnDrag={interactionMode === 'mouse'}
            selectionOnDrag={interactionMode === 'touchpad'}
            nodeTypes={memoizedNodeTypes}
            nodes={memoizedNodes}
            edges={memoizedEdges}
            nodesDraggable={false}
            deleteKeyCode={['Backspace', 'Delete']}
            multiSelectionKeyCode={['Shift', 'Meta']}
          >
            {nodes?.length === 0 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                <div className="flex items-center justify-center text-gray-500 text-center">
                  <div className="text-[20px]">{t('canvas.emptyText')}</div>
                  <Button
                    icon={<IconCreateDocument className="-mr-1 flex items-center justify-center" />}
                    type="text"
                    className="ml-0.5 text-[20px] text-[#00968F] py-[4px] px-[8px]"
                    onClick={() => {}}
                    data-cy="canvas-create-document-button"
                  >
                    返回首页
                  </Button>
                </div>
              </div>
            )}

            {memoizedBackground}
            {memoizedMiniMap}
          </ReactFlow>

          {/* <LayoutControl mode={interactionMode} changeMode={toggleInteractionMode} /> */}
        </div>

        {/* {showPreview && (
          <div
            ref={previewContainerRef}
            className="absolute top-[64px] bottom-0 right-2 overflow-x-auto preview-container"
            style={{
              maxWidth: showMaxRatio ? '900px' : '440px',
            }}
            onScroll={(e) => updateIndicators(e.currentTarget)}
          >
            <div className="relative h-full">
              <div className="flex gap-2 h-full">
                {nodePreviews?.filter(Boolean)?.map((node) => (
                  <NodePreview key={node?.id} node={node} canvasId={canvasId} />
                ))}
              </div>
            </div>
          </div>
        )} */}

        {/* <CanvasListModal visible={showCanvasListModal} setVisible={setShowCanvasListModal} /> */}
        {/* <LibraryModal visible={showLibraryModal} setVisible={setShowLibraryModal} /> */}
        {/* <BigSearchModal /> */}

        {/* {contextMenu.open && contextMenu.type === 'canvas' && (
          <ContextMenu
            open={contextMenu.open}
            position={contextMenu.position}
            setOpen={(open) => setContextMenu((prev) => ({ ...prev, open }))}
            isSelection={contextMenu.isSelection}
          />
        )} */}

        {/* {contextMenu.open &&
          contextMenu.type === 'node' &&
          contextMenu.nodeId &&
          contextMenu.nodeType && (
            <NodeContextMenu
              open={contextMenu.open}
              position={contextMenu.position}
              nodeId={contextMenu.nodeId}
              nodeType={contextMenu.nodeType}
              setOpen={(open) => setContextMenu((prev) => ({ ...prev, open }))}
            />
          )}

        {contextMenu.open && contextMenu.type === 'selection' && (
          <SelectionContextMenu
            open={contextMenu.open}
            position={contextMenu.position}
            setOpen={(open) => setContextMenu((prev) => ({ ...prev, open }))}
          />
        )}

        {selectedNodes.length > 0 && <MultiSelectionMenus />} */}
      </div>
    </Spin>
  );
});

export const ShareCanvas = (props: { canvasId: string }) => {
  const { canvasId } = props;

  return <Flow canvasId={canvasId} />;
};
