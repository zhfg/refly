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
import cn from 'classnames';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import classNames from 'classnames';
import { nodeActionEmitter } from '@refly-packages/ai-workspace-common/events/nodeActions';
import {
  createNodeEventName,
  cleanupNodeEvents,
} from '@refly-packages/ai-workspace-common/events/nodeActions';
import { useNodeHoverEffect } from '@refly-packages/ai-workspace-common/hooks/canvas/use-node-hover';
import { useCanvasData } from '@refly-packages/ai-workspace-common/hooks/canvas/use-canvas-data';
import {
  MAX_HEIGHT_CLASS,
  useNodeSize,
} from '@refly-packages/ai-workspace-common/hooks/canvas/use-node-size';
import { NodeHeader } from './shared/node-header';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';
import { useEditorPerformance } from '@refly-packages/ai-workspace-common/context/editor-performance';
import { NodeResizer as NodeResizerComponent } from './shared/node-resizer';
import { IconCodeArtifact } from '@refly-packages/ai-workspace-common/components/common/icon';
import { useInsertToDocument } from '@refly-packages/ai-workspace-common/hooks/canvas/use-insert-to-document';
import { useAddNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-add-node';
import { genSkillID } from '@refly-packages/utils/id';
import CodeViewer from '@refly-packages/ai-workspace-common/modules/artifacts/code-runner/code-viewer';
import { useSetNodeDataByEntity } from '@refly-packages/ai-workspace-common/hooks/canvas/use-set-node-data-by-entity';
import { CodeArtifactType } from '@refly-packages/ai-workspace-common/modules/artifacts/code-runner/types';
import { IContextItem } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { ConfigScope, Skill } from '@refly/openapi-schema';
import Moveable from 'react-moveable';

interface NodeContentProps {
  data: CanvasNodeData<CodeArtifactNodeMeta>;
  isOperating?: boolean;
}

const NodeContent = memo(
  ({ data, isOperating }: NodeContentProps) => {
    const { language = 'html', activeTab = 'code', type = 'text/html' } = data?.metadata ?? {};
    const [_, setIsShowingCodeViewer] = useState(true);
    const [currentTab, setCurrentTab] = useState<'code' | 'preview'>(
      activeTab as 'code' | 'preview',
    );
    const [currentType, setCurrentType] = useState<CodeArtifactType>(type as CodeArtifactType);
    const { t } = useTranslation();

    // Use isOperating for UI state (disabled controls when operating)
    const isReadOnly = !!isOperating;

    // Sync local state with metadata changes
    useEffect(() => {
      // Only update if activeTab changes and is different from current state
      const metadataActiveTab = data?.metadata?.activeTab as 'code' | 'preview';
      if (metadataActiveTab && metadataActiveTab !== currentTab) {
        setCurrentTab(metadataActiveTab);
      }

      // Update type if it changes in metadata
      const metadataType = data?.metadata?.type as CodeArtifactType;
      if (metadataType && metadataType !== currentType) {
        setCurrentType(metadataType);
      }
    }, [data?.metadata?.activeTab, currentTab, data?.metadata?.type, currentType]);

    const setNodeDataByEntity = useSetNodeDataByEntity();
    const { addNode } = useAddNode();

    // Update node data when tab changes
    const handleTabChange = useCallback(
      (tab: 'code' | 'preview') => {
        setCurrentTab(tab);

        if (data?.entityId) {
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
      [data?.entityId, data?.metadata, setNodeDataByEntity],
    );

    // Handle type changes
    const handleTypeChange = useCallback(
      (newType: CodeArtifactType) => {
        // Update local state first
        setCurrentType(newType);

        // Ensure newType is a valid CodeArtifactType
        if (data?.entityId && newType) {
          setNodeDataByEntity(
            {
              type: 'codeArtifact',
              entityId: data.entityId,
            },
            {
              metadata: {
                ...data?.metadata,
                type: newType,
              },
            },
          );
        }
      },
      [data?.entityId, data?.metadata, setNodeDataByEntity, setCurrentType],
    );

    // Always show the content, even when generating
    return (
      <div className="h-full min-h-[384px]">
        <CodeViewer
          code={data?.contentPreview || ''}
          language={language}
          title={data?.title || t('codeArtifact.defaultTitle', 'Code Artifact')}
          isGenerating={data?.metadata?.status === 'generating'}
          activeTab={currentTab}
          entityId={data?.entityId ?? ''}
          onTabChange={handleTabChange}
          onTypeChange={handleTypeChange}
          onClose={() => {
            setIsShowingCodeViewer(false);
          }}
          onRequestFix={(error) => {
            if (!data.entityId) return;

            // Define a proper code fix skill similar to editDoc
            const codeFixSkill: Skill = {
              name: 'codeArtifacts',
              icon: {
                type: 'emoji',
                value: '🔧',
              },
              description: t('codeArtifact.fix.title'),
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
                  title: t('codeArtifact.fix.title'),
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
                    query: t('codeArtifact.fix.query', {
                      errorMessage: error,
                    }),
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
                        displayValue: t('codeArtifact.fix.errorConfig'),
                        label: t('codeArtifact.fix.errorConfig'),
                      },
                    },
                  },
                },
              },
              [{ type: 'codeArtifact', entityId: data.entityId }],
              false,
              true,
            );
          }}
          onChange={(updatedCode) => {
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
          }}
          readOnly={isReadOnly}
          type={currentType}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Compare content
    const contentEqual = prevProps.data?.contentPreview === nextProps.data?.contentPreview;

    // Compare metadata properties
    const languageEqual = prevProps.data?.metadata?.language === nextProps.data?.metadata?.language;
    const statusEqual = prevProps.data?.metadata?.status === nextProps.data?.metadata?.status;
    const activeTabEqual =
      prevProps.data?.metadata?.activeTab === nextProps.data?.metadata?.activeTab;
    const sizeModeEqual = prevProps.data?.metadata?.sizeMode === nextProps.data?.metadata?.sizeMode;
    const typeEqual = prevProps.data?.metadata?.type === nextProps.data?.metadata?.type;

    return (
      contentEqual && languageEqual && statusEqual && activeTabEqual && sizeModeEqual && typeEqual
    );
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
    const [isResizing] = useState(false);
    const { edges } = useCanvasData();
    const { getNode } = useReactFlow();
    const { addNode } = useAddNode();
    const { t } = useTranslation();

    const { sizeMode = 'adaptive' } = data?.metadata ?? {};

    const { i18n } = useTranslation();
    const language = i18n.languages?.[0];
    const moveableRef = useRef<Moveable>(null);
    const targetRef = useRef<HTMLDivElement>(null);
    const codeViewerRef = useRef<HTMLDivElement>(null);

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

    // Enhanced resize handler
    const handleEnhancedResize = useCallback(
      (params: any) => {
        // Disable pointer events on code viewer during resize
        if (codeViewerRef.current) {
          codeViewerRef.current.style.pointerEvents = 'none';
        }
        handleResize(params);
      },
      [handleResize],
    );

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
      // Get the current model
      const { skillSelectedModel } = useChatStore.getState();

      // Define a default code fix skill
      const defaultCodeFixSkill: Skill = {
        name: 'codeArtifacts',
        icon: {
          type: 'emoji',
          value: '🔧',
        },
        description: t('codeArtifact.fix.title'),
        configSchema: {
          items: [],
        },
      };

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
                    ? `${data.title} - ${data?.contentPreview?.slice(0, 10)}`
                    : data.title,
                  entityId: data.entityId,
                  metadata: {
                    ...data.metadata,
                    withHistory: true,
                  },
                },
              ] as IContextItem[],
              query: '',
              selectedSkill: defaultCodeFixSkill,
              modelInfo: skillSelectedModel,
            },
          },
        },
        [{ type: 'codeArtifact', entityId: data.entityId }],
        false,
        true,
      );
    }, [data, addNode, t]);

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
      <div
        className={classNames({ nowheel: isOperating && isHovered })}
        data-cy="code-artifact-node"
      >
        <div
          ref={targetRef}
          className={classNames({
            'relative nodrag nopan select-text': isOperating,
            'pointer-events-none': isResizing,
          })}
          style={isPreview ? { width: 288, height: 200 } : containerStyle}
          onClick={onNodeClick}
        >
          {!isPreview && !hideActions && !isDragging && !readonly && (
            <ActionButtons type="codeArtifact" nodeId={id} isNodeHovered={selected && isHovered} />
          )}

          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`h-full flex flex-col ${getNodeCommonStyles({ selected, isHovered })} ${isResizing ? 'pointer-events-none' : ''}`}
          >
            {!isPreview && !hideHandles && (
              <>
                <CustomHandle
                  id={`${id}-target`}
                  type="target"
                  position={Position.Left}
                  isConnected={isTargetConnected}
                  isNodeHovered={isHovered}
                  nodeType="response"
                />
                <CustomHandle
                  id={`${id}-source`}
                  type="source"
                  position={Position.Right}
                  isConnected={isSourceConnected}
                  isNodeHovered={isHovered}
                  nodeType="response"
                />
              </>
            )}

            <div className={cn('flex flex-col h-full p-3 box-border', MAX_HEIGHT_CLASS)}>
              <NodeHeader
                title={data?.title || t('canvas.nodeTypes.codeArtifact')}
                Icon={IconCodeArtifact}
                iconBgColor="#3E63DD"
              />

              <div
                className={cn('relative flex-grow overflow-y-auto pr-2 -mr-2', {
                  'pointer-events-none': isResizing,
                })}
              >
                {/* Only render content when not in compact mode */}
                {sizeMode === 'adaptive' && (
                  <div
                    ref={codeViewerRef}
                    style={{
                      height: '100%',
                      minHeight: '384px',
                      overflowY: 'auto',
                    }}
                    className={isResizing ? 'pointer-events-none' : ''}
                  >
                    <NodeContent data={data} isOperating={isOperating} />
                  </div>
                )}
              </div>
              <div className="flex justify-end items-center text-[10px] text-gray-400 mt-1 px-1">
                {time(data.createdAt, language as LOCALE)
                  ?.utc()
                  ?.fromNow()}
              </div>
            </div>
          </div>
        </div>

        {!isPreview && selected && sizeMode === 'adaptive' && !readonly && (
          <NodeResizerComponent
            moveableRef={moveableRef}
            targetRef={targetRef}
            isSelected={selected}
            isHovered={isHovered}
            isPreview={isPreview}
            sizeMode={sizeMode}
            onResize={handleEnhancedResize}
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
    const prevType = prevProps.data?.metadata?.type;
    const nextType = nextProps.data?.metadata?.type;
    const typeEqual = prevType === nextType;

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
      typeEqual &&
      styleEqual &&
      sizeModeEqual
    );
  },
);
