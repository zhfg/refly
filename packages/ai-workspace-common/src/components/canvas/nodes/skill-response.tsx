import { Position, NodeProps, useReactFlow } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { CanvasNodeData, ResponseNodeMeta, CanvasNode, SkillResponseNodeProps } from './types';
import { Node } from '@xyflow/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { CustomHandle } from './custom-handle';
import { LuChevronRight } from 'react-icons/lu';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { EDGE_STYLES } from '../constants';
import { getNodeCommonStyles } from './index';
import { ActionButtons } from './action-buttons';
import { useDeleteNode } from '@refly-packages/ai-workspace-common/hooks/use-delete-node';
import { useInsertToDocument } from '@refly-packages/ai-workspace-common/hooks/use-insert-to-document';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { useCreateDocument } from '@refly-packages/ai-workspace-common/hooks/use-create-document';
import { useAddToChatHistory } from '@refly-packages/ai-workspace-common/hooks/use-add-to-chat-history';
import { IconCanvas, IconLoading, IconSearch } from '@refly-packages/ai-workspace-common/components/common/icon';
import { NodeItem } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { LOCALE } from '@refly/common-types';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';
import { getArtifactIcon } from '@refly-packages/ai-workspace-common/components/common/result-display';
import { useKnowledgeBaseStoreShallow } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { genUniqueId } from '@refly-packages/ai-workspace-common/utils';
import { CanvasSelectionContext } from '../../../modules/selection-menu/canvas-selection-context';
import Moveable from 'react-moveable';

type SkillResponseNode = Node<CanvasNodeData<ResponseNodeMeta>, 'skillResponse'>;

export const SkillResponseNode = (props: SkillResponseNodeProps) => {
  const { data, selected, id, hideActions = false, isPreview = false, hideHandles = false, onNodeClick } = props;
  const [isHovered, setIsHovered] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { edges } = useCanvasControl();
  const { setEdges, getNode } = useReactFlow();

  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];

  const node = getNode(id);
  const targetRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({
    width: node?.measured?.width ?? 288,
    height: node?.measured?.height ?? 'auto',
  });
  const moveableRef = useRef<Moveable>(null);

  const { title, contentPreview: content, metadata, createdAt } = data;
  const { status, modelName, artifacts, currentLog: log, structuredData } = metadata ?? {};
  const sources = Array.isArray(structuredData?.sources) ? structuredData?.sources : [];

  const logTitle = log
    ? t(`${log.key}.title`, {
        ...log.titleArgs,
        ns: 'skillLog',
        defaultValue: log.key,
      })
    : '';
  const logDescription = log
    ? t(`${log.key}.description`, {
        ...log.descriptionArgs,
        ns: 'skillLog',
        defaultValue: '',
      })
    : '';

  // Get query and response content from result
  const query = title || t('copilot.chatHistory.loading');

  // Check if node has any connections
  const isTargetConnected = edges?.some((edge) => edge.target === id);
  const isSourceConnected = edges?.some((edge) => edge.source === id);

  const buildNodeData = (text: string) => {
    const id = genUniqueId();

    const node: CanvasNode = {
      id,
      type: 'skillResponse',
      position: { x: 0, y: 0 },
      data: {
        entityId: data.entityId,
        title: data.title || 'Selected Content',
        metadata: {
          contentPreview: text,
          selectedContent: text,
          xPath: id,
          sourceEntityId: data.entityId,
          sourceEntityType: 'skillResponse',
          sourceType: 'skillResponseSelection',
        },
      },
    };

    return node;
  };

  // Handle node hover events
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.source === id || edge.target === id) {
          return {
            ...edge,
            style: EDGE_STYLES.hover,
          };
        }
        return edge;
      }),
    );
  }, [id, setEdges]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.source === id || edge.target === id) {
          return {
            ...edge,
            style: EDGE_STYLES.default,
          };
        }
        return edge;
      }),
    );
  }, [id, setEdges]);

  const handleAddToChatHistory = useAddToChatHistory(node as NodeItem);

  const handleRerun = useCallback(() => {
    // Implement rerun logic
    console.log('Rerun:', id);
  }, [id]);

  const runtime = getRuntime();
  const isWeb = runtime === 'web';
  const handleInsertToDoc = useInsertToDocument(data.entityId);

  const handleDelete = useDeleteNode(
    {
      id,
      type: 'skillResponse',
      data,
      position: { x: 0, y: 0 },
    } as CanvasNode,
    'skillResponse',
  );

  const handleHelpLink = useCallback(() => {
    // Implement help link logic
    console.log('Open help link');
  }, []);

  const handleAbout = useCallback(() => {
    // Implement about logic
    console.log('Show about info');
  }, []);

  const { debouncedCreateDocument, isCreating } = useCreateDocument();

  const handleCreateDocument = useCallback(async () => {
    await debouncedCreateDocument(data?.title ?? modelName, content, {
      sourceNodeId: data.entityId,
      addToCanvas: true,
    });
  }, [content, debouncedCreateDocument, data.entityId, data?.title, modelName]);

  const knowledgeBaseStore = useKnowledgeBaseStoreShallow((state) => ({
    updateSourceListDrawer: state.updateSourceListDrawer,
  }));

  const handleClickSources = useCallback(() => {
    knowledgeBaseStore.updateSourceListDrawer({
      visible: true,
      sources: sources,
      query: query,
    });
  }, [sources, query]);

  const { operatingNodeId } = useCanvasStoreShallow((state) => ({
    operatingNodeId: state.operatingNodeId,
  }));
  const isOperating = operatingNodeId === id;

  const renderContent = () => {
    if (!content) return null;

    return (
      <Markdown
        content={String(content)}
        sources={sources}
        className={`text-xs ${isOperating ? 'pointer-events-auto skill-response-node-content' : 'pointer-events-none'}`}
      />
    );
  };

  const resizeMoveable = useCallback((width: number, height: number) => {
    moveableRef.current?.request('resizable', { width, height });
  }, []);

  // Update size when content changes
  useEffect(() => {
    if (!targetRef.current) return;

    const { offsetWidth, offsetHeight } = targetRef.current;
    resizeMoveable(offsetWidth, offsetHeight);
  }, [content, artifacts?.length, sources.length]);

  return (
    <div
      className="relative group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onNodeClick}
      style={{
        userSelect: isOperating ? 'text' : 'none',
        cursor: isOperating ? 'text' : 'grab',
      }}
    >
      {isWeb && !hideActions && (
        <ActionButtons
          type="skill-response"
          nodeId={id}
          onAddToChatHistory={handleAddToChatHistory}
          onRerun={handleRerun}
          onInsertToDoc={() => handleInsertToDoc('insertBlow', content)}
          onCreateDocument={content ? handleCreateDocument : undefined}
          onDelete={handleDelete}
          onHelpLink={handleHelpLink}
          onAbout={handleAbout}
          isCompleted={metadata?.status === 'finish'}
          isCreatingDocument={isCreating}
        />
      )}

      {/* Main Card Container */}
      <div
        ref={targetRef}
        className="relative"
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
        }}
      >
        <div className={`relative h-full ${getNodeCommonStyles({ selected, isHovered })}`}>
          {!isPreview && !hideHandles && (
            <>
              <CustomHandle
                type="target"
                position={Position.Left}
                isConnected={isTargetConnected}
                isNodeHovered={isHovered}
                nodeType="response"
              />
              <CustomHandle
                type="source"
                position={Position.Right}
                isConnected={isSourceConnected}
                isNodeHovered={isHovered}
                nodeType="response"
              />
            </>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div
                className="
                w-6 
                h-6 
                rounded 
                bg-[#F79009]
                shadow-[0px_2px_4px_-2px_rgba(16,24,60,0.06),0px_4px_8px_-2px_rgba(16,24,60,0.1)]
                flex 
                items-center 
                justify-center
                flex-shrink-0
              "
              >
                <IconCanvas className="w-4 h-4 text-white" />
              </div>

              <span className="text-sm font-medium leading-normal truncate">{query}</span>
            </div>

            {status !== 'finish' && !content && !artifacts?.length && (
              <div className="flex items-center gap-2 mt-1 bg-gray-100 rounded-sm p-2">
                <IconLoading className="h-3 w-3 animate-spin text-green-500" />
                <span className="text-xs text-gray-500 max-w-48 truncate">
                  {log ? (
                    <>
                      <span className="text-green-500 font-medium">{logTitle + ' '}</span>
                      <span className="text-gray-500">{logDescription}</span>
                    </>
                  ) : (
                    t('canvas.skillResponse.aiThinking')
                  )}
                </span>
              </div>
            )}

            {sources.length > 0 && (
              <div
                className="flex items-center justify-between gap-2 border-gray-100 border-solid rounded-sm p-2 hover:bg-gray-50 cursor-pointer"
                onClick={handleClickSources}
              >
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <>
                    <IconSearch className="h-3 w-3 text-gray-500" />
                    {t('canvas.skillResponse.sourcesCnt', { count: sources.length })}
                  </>
                </span>
                <LuChevronRight className="h-3 w-3 text-gray-500" />
              </div>
            )}

            {artifacts?.length > 0 && (
              <div className="flex items-center gap-2">
                {artifacts.map((artifact) => (
                  <div
                    key={artifact.entityId}
                    className="border border-solid border-gray-300 rounded-sm px-2 py-1 w-full flex items-center gap-1"
                  >
                    {getArtifactIcon(artifact, 'text-gray-500')}
                    <span className="text-xs text-gray-500 max-w-[200px] truncate inline-block">{artifact.title}</span>
                  </div>
                ))}
              </div>
            )}

            <div ref={contentRef} className="skill-response-node-content relative">
              {renderContent()}
            </div>

            <div className="text-xs text-gray-400">
              {time(createdAt, language as LOCALE)
                ?.utc()
                ?.fromNow()}
            </div>
          </div>
        </div>
      </div>

      {!isPreview && selected && (
        <Moveable
          ref={moveableRef}
          target={targetRef}
          resizable={true}
          edge={false}
          zoom={1}
          throttleResize={1}
          renderDirections={['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se']}
          onResizeStart={({ setOrigin, dragStart }) => {
            setOrigin(['%', '%']);
            if (dragStart && dragStart instanceof MouseEvent) {
              dragStart.preventDefault();
            }
          }}
          onResize={({ target, width, height }) => {
            const newWidth = Math.max(100, width);
            const newHeight = Math.max(80, height);

            target.style.width = `${newWidth}px`;
            target.style.height = `${newHeight}px`;

            setSize({ width: newWidth, height: newHeight });
          }}
          hideDefaultLines={true}
          className={`!pointer-events-auto ${!isHovered ? 'moveable-control-hidden' : 'moveable-control-show'}`}
        />
      )}
    </div>
  );
};
