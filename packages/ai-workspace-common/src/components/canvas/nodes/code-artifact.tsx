import { memo, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Position, useReactFlow } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import {
  CanvasNode,
  CanvasNodeData,
  CodeArtifactNodeMeta,
  CodeArtifactNodeProps,
} from './shared/types';
import { CustomHandle } from './shared/custom-handle';
import { getNodeCommonStyles } from './index';
import { ActionButtons } from './shared/action-buttons';
import { useAddToContext } from '@refly-packages/ai-workspace-common/hooks/canvas/use-add-to-context';
import { useDeleteNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-delete-node';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { LOCALE } from '@refly/common-types';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import classNames from 'classnames';
import { nodeActionEmitter } from '@refly-packages/ai-workspace-common/events/nodeActions';
import {
  createNodeEventName,
  cleanupNodeEvents,
} from '@refly-packages/ai-workspace-common/events/nodeActions';
import { useNodeHoverEffect } from '@refly-packages/ai-workspace-common/hooks/canvas/use-node-hover';
import { useCanvasData } from '@refly-packages/ai-workspace-common/hooks/canvas/use-canvas-data';
import { useNodeSize } from '@refly-packages/ai-workspace-common/hooks/canvas/use-node-size';
import { NodeHeader } from './shared/node-header';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';
import { useEditorPerformance } from '@refly-packages/ai-workspace-common/context/editor-performance';
import CodeViewerLayout from '@refly-packages/ai-workspace-common/modules/artifacts/code-runner/code-viewer-layout';
import CodeViewer from '@refly-packages/ai-workspace-common/modules/artifacts/code-runner/code-viewer';
import { NodeResizer as NodeResizerComponent } from './shared/node-resizer';
import { useSetNodeDataByEntity } from '@refly-packages/ai-workspace-common/hooks/canvas/use-set-node-data-by-entity';
import { useInsertToDocument } from '@refly-packages/ai-workspace-common/hooks/canvas/use-insert-to-document';
import { useAddNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-add-node';
import { genSkillID } from '@refly-packages/utils/id';
import { IContextItem } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { IconCodeArtifact } from '@refly-packages/ai-workspace-common/components/common/icon';
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { ConfigScope, Skill } from '@refly/openapi-schema';

const NodeContent = memo(
  ({ data }: { data: CanvasNodeData<CodeArtifactNodeMeta>; isOperating: boolean }) => {
    const { language = 'typescript', activeTab = 'code' } = data?.metadata ?? {};
    const [isShowingCodeViewer, setIsShowingCodeViewer] = useState(true);
    const { t } = useTranslation();
    const setNodeDataByEntity = useSetNodeDataByEntity();
    const { addNode } = useAddNode();

    // Use activeTab from metadata with fallback to 'code'
    const [currentTab, setCurrentTab] = useState<'code' | 'preview'>(
      activeTab as 'code' | 'preview',
    );

    // Sync local state with metadata changes
    useEffect(() => {
      // Only update if activeTab changes and is different from current state
      const metadataActiveTab = data?.metadata?.activeTab as 'code' | 'preview';
      if (metadataActiveTab && metadataActiveTab !== currentTab) {
        setCurrentTab(metadataActiveTab);
      }
    }, [data?.metadata?.activeTab, currentTab]);

    // Update node data when tab changes
    const handleTabChange = useCallback(
      (tab: 'code' | 'preview') => {
        setCurrentTab(tab);

        if (data.entityId) {
          setNodeDataByEntity(
            {
              type: 'codeArtifact',
              entityId: data.entityId,
            },
            {
              metadata: {
                ...data.metadata,
                activeTab: tab,
              },
            },
          );
        }
      },
      [data.entityId, data.metadata, setNodeDataByEntity],
    );

    const handleRequestFix = useCallback(
      (error: string) => {
        if (!data.entityId) return;

        // Define a proper code fix skill similar to editDoc
        const codeFixSkill: Skill = {
          name: 'codeArtifacts',
          icon: {
            type: 'emoji',
            value: '🔧',
          },
          description: 'Fix code errors',
          configSchema: {
            items: [],
          },
        };

        // Get the current model
        const { selectedModel } = useChatStore.getState();

        addNode(
          {
            type: 'skill',
            data: {
              title: t('codeArtifact.fix.title', 'Fix Code Error'),
              entityId: genSkillID(),
              metadata: {
                contextItems: [
                  {
                    type: 'codeArtifact',
                    title: data?.contentPreview
                      ? `${data.title} - ${data.contentPreview?.slice(0, 10)}`
                      : data.title,
                    entityId: data.entityId,
                    metadata: data.metadata,
                  },
                ] as IContextItem[],
                query: t(
                  'codeArtifact.fix.query',
                  'Help me optimize this code. I got the following error:\n\n{{errorMessage}}',
                  {
                    errorMessage: error,
                  },
                ),
                selectedSkill: codeFixSkill,
                modelInfo: selectedModel,
                tplConfig: {
                  codeErrorConfig: {
                    value: {
                      errorMessage: error,
                      language: data?.metadata?.language || 'typescript',
                      codeEntityId: data.entityId,
                    },
                    configScope: 'runtime' as unknown as ConfigScope,
                    displayValue: t('codeArtifact.fix.errorConfig', 'Code Error Config'),
                    label: t('codeArtifact.fix.errorConfig', 'Code Error Config'),
                  },
                },
              },
            },
          },
          [{ type: 'codeArtifact', entityId: data.entityId }],
          false,
          true,
        );
      },
      [addNode, data, t],
    );

    const handleCodeChange = useCallback(
      (updatedCode: string) => {
        if (data.entityId) {
          setNodeDataByEntity(
            {
              type: 'codeArtifact',
              entityId: data.entityId,
            },
            {
              contentPreview: updatedCode,
            },
          );
        }
      },
      [data.entityId, setNodeDataByEntity],
    );

    // Always show the content, even when generating
    return (
      <CodeViewerLayout isShowing={isShowingCodeViewer}>
        {isShowingCodeViewer && (
          <CodeViewer
            code={data.contentPreview || ''}
            language={language}
            title={data.title || t('codeArtifact.defaultTitle', 'Code Artifact')}
            isGenerating={data?.metadata?.status === 'generating'}
            activeTab={currentTab}
            onTabChange={handleTabChange}
            onClose={() => {
              setIsShowingCodeViewer(false);
            }}
            onRequestFix={handleRequestFix}
            onChange={handleCodeChange}
            readOnly={true}
          />
        )}
      </CodeViewerLayout>
    );
  },
  (prevProps, nextProps) => {
    // Basic equality check for content
    const contentEqual = prevProps.data?.contentPreview === nextProps.data?.contentPreview;

    // Check metadata properties
    const languageEqual = prevProps.data?.metadata?.language === nextProps.data?.metadata?.language;
    const statusEqual = prevProps.data?.metadata?.status === nextProps.data?.metadata?.status;
    const activeTabEqual =
      prevProps.data?.metadata?.activeTab === nextProps.data?.metadata?.activeTab;

    // Check operation state
    const operatingEqual = prevProps.isOperating === nextProps.isOperating;

    return contentEqual && languageEqual && statusEqual && activeTabEqual && operatingEqual;
  },
);

export const CodeArtifactNode = memo(
  ({
    id,
    data,
    isPreview,
    selected,
    hideActions,
    hideHandles,
    onNodeClick,
  }: CodeArtifactNodeProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const { edges } = useCanvasData();
    const { getNode } = useReactFlow();
    const { addNode } = useAddNode();

    const { sizeMode = 'adaptive' } = data?.metadata ?? {};

    const { i18n } = useTranslation();
    const language = i18n.languages?.[0];

    const targetRef = useRef<HTMLDivElement>(null);

    const { operatingNodeId } = useCanvasStoreShallow((state) => ({
      operatingNodeId: state.operatingNodeId,
    }));

    const { draggingNodeId } = useEditorPerformance();
    const isOperating = operatingNodeId === id;
    const isDragging = draggingNodeId === id;
    const node = useMemo(() => getNode(id), [id, getNode]);

    const { readonly } = useCanvasContext();

    const { containerStyle, handleResize } = useNodeSize({
      id,
      node,
      sizeMode,
      isOperating,
      minWidth: 100,
      maxWidth: 800,
      minHeight: 80,
      defaultWidth: 288,
      defaultHeight: 384,
    });

    // Check if node has any connections
    const isTargetConnected = edges?.some((edge) => edge.target === id);
    const isSourceConnected = edges?.some((edge) => edge.source === id);

    const { handleMouseEnter: onHoverStart, handleMouseLeave: onHoverEnd } = useNodeHoverEffect(id);

    const handleMouseEnter = useCallback(() => {
      if (!isHovered) {
        setIsHovered(true);
        onHoverStart();
      }
    }, [isHovered, onHoverStart]);

    const handleMouseLeave = useCallback(() => {
      if (isHovered) {
        setIsHovered(false);
        onHoverEnd();
      }
    }, [isHovered, onHoverEnd]);

    const { addToContext } = useAddToContext();

    const handleAddToContext = useCallback(() => {
      addToContext({
        type: 'codeArtifact',
        title: data.title,
        entityId: data.entityId,
        metadata: data.metadata,
      });
    }, [data, addToContext]);

    const { deleteNode } = useDeleteNode();

    const handleDelete = useCallback(() => {
      deleteNode({
        id,
        type: 'codeArtifact',
        data,
        position: { x: 0, y: 0 },
      } as CanvasNode);
    }, [id, data, deleteNode]);

    const insertToDoc = useInsertToDocument(data.entityId);
    const handleInsertToDoc = useCallback(async () => {
      if (!data?.contentPreview) return;
      await insertToDoc('insertBelow', data?.contentPreview);
    }, [insertToDoc, data]);

    const handleAskAI = useCallback(() => {
      addNode(
        {
          type: 'skill',
          data: {
            title: 'Skill',
            entityId: genSkillID(),
            metadata: {
              contextItems: [
                {
                  type: 'codeArtifact',
                  title: data?.contentPreview
                    ? `${data.title} - ${data.contentPreview?.slice(0, 10)}`
                    : data.title,
                  entityId: data.entityId,
                  metadata: data.metadata,
                },
              ] as IContextItem[],
            },
          },
        },
        [{ type: 'codeArtifact', entityId: data.entityId }],
        false,
        true,
      );
    }, [data, addNode]);

    // Add event handling
    useEffect(() => {
      // Create node-specific event handlers
      const handleNodeAddToContext = () => handleAddToContext();
      const handleNodeDelete = () => handleDelete();
      const handleNodeInsertToDoc = () => handleInsertToDoc();
      const handleNodeAskAI = () => handleAskAI();

      // Register events with node ID
      nodeActionEmitter.on(createNodeEventName(id, 'addToContext'), handleNodeAddToContext);
      nodeActionEmitter.on(createNodeEventName(id, 'delete'), handleNodeDelete);
      nodeActionEmitter.on(createNodeEventName(id, 'insertToDoc'), handleNodeInsertToDoc);
      nodeActionEmitter.on(createNodeEventName(id, 'askAI'), handleNodeAskAI);

      return () => {
        // Cleanup events when component unmounts
        nodeActionEmitter.off(createNodeEventName(id, 'addToContext'), handleNodeAddToContext);
        nodeActionEmitter.off(createNodeEventName(id, 'delete'), handleNodeDelete);
        nodeActionEmitter.off(createNodeEventName(id, 'insertToDoc'), handleNodeInsertToDoc);
        nodeActionEmitter.off(createNodeEventName(id, 'askAI'), handleNodeAskAI);

        // Clean up all node events
        cleanupNodeEvents(id);
      };
    }, [id, handleAddToContext, handleDelete, handleInsertToDoc, handleAskAI]);

    return (
      <div className={classNames({ nowheel: isOperating })}>
        <div
          ref={targetRef}
          style={isPreview ? { width: 288, height: 200 } : containerStyle}
          onMouseEnter={!isPreview ? handleMouseEnter : undefined}
          onMouseLeave={!isPreview ? handleMouseLeave : undefined}
          onClick={onNodeClick}
          className={classNames({
            'nodrag nopan select-text': isOperating,
          })}
        >
          {!isPreview && !hideActions && !isDragging && !readonly && (
            <ActionButtons type="codeArtifact" nodeId={id} isNodeHovered={isHovered} />
          )}

          <div
            className={`
          h-full
          flex flex-col
          ${getNodeCommonStyles({ selected: !isPreview && selected, isHovered })}
        `}
          >
            <div className="flex flex-col h-full relative p-3 box-border">
              <NodeHeader title={data.title} Icon={IconCodeArtifact} iconBgColor="#3E63DD" />

              <div className="relative flex-grow min-h-0">
                <div
                  style={{
                    height: '100%',
                    overflowY: 'auto',
                    maxHeight: sizeMode === 'compact' ? '40px' : '',
                  }}
                >
                  <NodeContent data={data} isOperating={isOperating} />
                </div>
              </div>
              {/* Timestamp container */}
              <div className="flex justify-end items-center text-[10px] text-gray-400 mt-1 px-1">
                {time(data.createdAt, language as LOCALE)
                  ?.utc()
                  ?.fromNow()}
              </div>
            </div>

            {/* Handles */}
            {!isPreview && !hideHandles && (
              <>
                <CustomHandle
                  id={`${id}-target`}
                  type="target"
                  position={Position.Left}
                  isConnected={isTargetConnected}
                  isNodeHovered={isHovered}
                  nodeType="codeArtifact"
                />
                <CustomHandle
                  id={`${id}-source`}
                  type="source"
                  position={Position.Right}
                  isConnected={isSourceConnected}
                  isNodeHovered={isHovered}
                  nodeType="codeArtifact"
                />
              </>
            )}
          </div>
        </div>

        {!isPreview && selected && sizeMode === 'adaptive' && !readonly && (
          <NodeResizerComponent
            targetRef={targetRef}
            isSelected={selected}
            isHovered={isHovered}
            isPreview={isPreview}
            sizeMode={sizeMode}
            onResize={handleResize}
          />
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Compare style and sizeMode
    const prevStyle = prevProps.data?.metadata?.style;
    const nextStyle = nextProps.data?.metadata?.style;
    const styleEqual = JSON.stringify(prevStyle) === JSON.stringify(nextStyle);

    const prevSizeMode = prevProps.data?.metadata?.sizeMode;
    const nextSizeMode = nextProps.data?.metadata?.sizeMode;
    const sizeModeEqual = prevSizeMode === nextSizeMode;

    // Compare activeTab specifically
    const prevActiveTab = prevProps.data?.metadata?.activeTab;
    const nextActiveTab = nextProps.data?.metadata?.activeTab;
    const activeTabEqual = prevActiveTab === nextActiveTab;

    return (
      prevProps.id === nextProps.id &&
      prevProps.selected === nextProps.selected &&
      prevProps.isPreview === nextProps.isPreview &&
      prevProps.hideActions === nextProps.hideActions &&
      prevProps.hideHandles === nextProps.hideHandles &&
      prevProps.data?.title === nextProps.data?.title &&
      prevProps.data?.contentPreview === nextProps.data?.contentPreview &&
      prevProps.data?.createdAt === nextProps.data?.createdAt &&
      prevProps.data?.metadata?.status === nextProps.data?.metadata?.status &&
      prevProps.data?.metadata?.language === nextProps.data?.metadata?.language &&
      activeTabEqual &&
      styleEqual &&
      sizeModeEqual
    );
  },
);
