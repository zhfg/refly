import { Position, useReactFlow } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { CanvasNodeData, ResourceNodeMeta, CanvasNode, ResourceNodeProps } from './types';
import { Node } from '@xyflow/react';
import { CustomHandle } from './custom-handle';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useEdgeStyles } from '../constants';
import { getNodeCommonStyles } from './index';
import { ActionButtons } from './action-buttons';
import { useAddToContext } from '@refly-packages/ai-workspace-common/hooks/canvas/use-add-to-context';
import { useDeleteNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-delete-node';
import { HiOutlineSquare3Stack3D } from 'react-icons/hi2';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { LOCALE } from '@refly/common-types';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';
import { useThrottledCallback } from 'use-debounce';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { useGetResourceDetail } from '@refly-packages/ai-workspace-common/queries';
import Moveable from 'react-moveable';
import classNames from 'classnames';
import { nodeActionEmitter } from '@refly-packages/ai-workspace-common/events/nodeActions';
import { createNodeEventName, cleanupNodeEvents } from '@refly-packages/ai-workspace-common/events/nodeActions';
import { memo } from 'react';
import { useSetNodeDataByEntity } from '@refly-packages/ai-workspace-common/hooks/canvas/use-set-node-data-by-entity';
import { useNodeHoverEffect } from '@refly-packages/ai-workspace-common/hooks/canvas/use-node-hover';
import { useCanvasData } from '@refly-packages/ai-workspace-common/hooks/canvas/use-canvas-data';
import { useAddNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-add-node';
import { genSkillID } from '@refly-packages/utils/id';
import { IContextItem } from '@refly-packages/ai-workspace-common/stores/context-panel';

type ResourceNode = Node<CanvasNodeData<ResourceNodeMeta>, 'resource'>;

const NodeHeader = memo(({ title, ResourceIcon }: { title: string; ResourceIcon: any }) => {
  return (
    <div className="flex-shrink-0 mb-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-[#17B26A] shadow-[0px_2px_4px_-2px_rgba(16,24,60,0.06),0px_4px_8px_-2px_rgba(16,24,60,0.1)] flex items-center justify-center flex-shrink-0">
          <ResourceIcon className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-medium leading-normal text-[rgba(0,0,0,0.8)] truncate">{title}</span>
      </div>
    </div>
  );
});

export const ResourceNode = memo(
  ({ id, data, isPreview, selected, hideActions, hideHandles, onNodeClick }: ResourceNodeProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const { edges } = useCanvasData();
    const setNodeDataByEntity = useSetNodeDataByEntity();
    const { setEdges, getNode } = useReactFlow();
    const ResourceIcon = data?.metadata?.resourceType === 'weblink' ? HiOutlineSquare3Stack3D : HiOutlineSquare3Stack3D;

    const { i18n, t } = useTranslation();
    const language = i18n.languages?.[0];

    const targetRef = useRef<HTMLDivElement>(null);

    // Memoize node and its measurements
    const node = useMemo(() => getNode(id), [id, getNode]);
    const initialSize = useMemo(
      () => ({
        width: node?.measured?.width ?? 288,
        height: node?.measured?.height ?? 384,
      }),
      [node?.measured?.width, node?.measured?.height],
    );

    const [size, setSize] = useState(initialSize);

    // Check if node has any connections
    const isTargetConnected = edges?.some((edge) => edge.target === id);
    const isSourceConnected = edges?.some((edge) => edge.source === id);

    const edgeStyles = useEdgeStyles();

    // 立即更新hover状态，但节流更新边缘样式
    const updateEdgeStyles = useThrottledCallback(
      (hoveredState: boolean) => {
        setEdges((eds) =>
          eds.map((edge) => {
            if (edge.source === id || edge.target === id) {
              return {
                ...edge,
                style: hoveredState ? edgeStyles.hover : edgeStyles.default,
              };
            }
            return edge;
          }),
        );
      },
      500,
      { leading: true, trailing: false },
    );

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
        type: 'resource',
        title: data.title,
        entityId: data.entityId,
        metadata: data.metadata,
      });
    }, [id, data, addToContext]);

    const { deleteNode } = useDeleteNode();

    const handleDelete = useCallback(() => {
      deleteNode({
        id,
        type: 'resource',
        data,
        position: { x: 0, y: 0 },
      } as CanvasNode);
    }, [id, data, deleteNode]);

    const handleHelpLink = useCallback(() => {
      // Implement help link logic
      console.log('Open help link');
    }, []);

    const handleAbout = useCallback(() => {
      // Implement about logic
      console.log('Show about info');
    }, []);

    const { addNode } = useAddNode();

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
                  type: 'resource',
                  title: data.title,
                  entityId: data.entityId,
                  metadata: data.metadata,
                },
              ] as IContextItem[],
            },
          },
        },
        [{ type: 'resource', entityId: data.entityId }],
      );
    }, [id, data, addNode]);

    const { operatingNodeId } = useCanvasStoreShallow((state) => ({
      operatingNodeId: state.operatingNodeId,
    }));

    const isOperating = operatingNodeId === id;

    const [shouldPoll, setShouldPoll] = useState(false);
    const { data: result } = useGetResourceDetail(
      {
        query: { resourceId: data?.entityId },
      },
      null,
      {
        enabled: shouldPoll,
        refetchInterval: shouldPoll ? 2000 : false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        staleTime: 60 * 1000, // Data fresh for 1 minute
        gcTime: 5 * 60 * 1000, // Cache for 5 minutes
      },
    );
    const remoteResult = result?.data;

    useEffect(() => {
      if (!data.contentPreview) {
        setNodeDataByEntity(
          {
            entityId: data.entityId,
            type: 'resource',
          },
          {
            contentPreview: remoteResult?.contentPreview,
          },
        );
        if (remoteResult?.indexStatus === 'wait_parse') {
          setShouldPoll(true);
        } else {
          setShouldPoll(false);
        }
      } else {
        setShouldPoll(false);
      }
    }, [data.contentPreview, remoteResult]);

    // Add event handling
    useEffect(() => {
      // Create node-specific event handlers
      const handleNodeAddToContext = () => handleAddToContext();
      const handleNodeDelete = () => handleDelete();
      const handleNodeAskAI = () => handleAskAI();

      // Register events with node ID
      nodeActionEmitter.on(createNodeEventName(id, 'addToContext'), handleNodeAddToContext);
      nodeActionEmitter.on(createNodeEventName(id, 'delete'), handleNodeDelete);
      nodeActionEmitter.on(createNodeEventName(id, 'askAI'), handleNodeAskAI);

      return () => {
        // Cleanup events when component unmounts
        nodeActionEmitter.off(createNodeEventName(id, 'addToContext'), handleNodeAddToContext);
        nodeActionEmitter.off(createNodeEventName(id, 'delete'), handleNodeDelete);
        nodeActionEmitter.off(createNodeEventName(id, 'askAI'), handleNodeAskAI);

        // Clean up all node events
        cleanupNodeEvents(id);
      };
    }, [id, handleAddToContext, handleDelete, handleAskAI]);

    const nodeStyle = useMemo(
      () => ({
        width: `${size.width}px`,
        height: `${size.height}px`,
        userSelect: isOperating ? 'text' : 'none',
        cursor: isOperating ? 'text' : 'grab',
      }),
      [size.width, size.height, isOperating],
    );

    const handleResize = useCallback(({ target, width, height, direction }) => {
      const newWidth = Math.max(100, width);
      const newHeight = Math.max(80, height);

      let newLeft = target.offsetLeft;
      let newTop = target.offsetTop;

      if (direction[0] === -1) {
        newLeft = target.offsetLeft - (newWidth - target.offsetWidth);
      }
      if (direction[1] === -1) {
        newTop = target.offsetTop - (newHeight - target.offsetHeight);
      }

      target.style.width = `${newWidth}px`;
      target.style.height = `${newHeight}px`;
      target.style.left = `${newLeft}px`;
      target.style.top = `${newTop}px`;

      setSize({ width: newWidth, height: newHeight });
    }, []);

    // console.log('isOperating', isOperating);

    return (
      <div className={classNames({ nowheel: isOperating })}>
        <div
          ref={targetRef}
          className="relative"
          onMouseEnter={!isPreview ? handleMouseEnter : undefined}
          onMouseLeave={!isPreview ? handleMouseLeave : undefined}
          onClick={onNodeClick}
          style={
            {
              width: `${size.width}px`,
              height: `${size.height}px`,
              userSelect: isOperating ? 'text' : 'none',
              cursor: isOperating ? 'text' : 'grab',
            } as React.CSSProperties
          }
        >
          {!isPreview && !hideActions && <ActionButtons type="resource" nodeId={id} isNodeHovered={isHovered} />}

          <div
            className={`
          relative
          h-full
          ${getNodeCommonStyles({ selected: !isPreview && selected, isHovered })}
        `}
          >
            <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />

            <div className="flex flex-col h-full">
              <NodeHeader title={data.title} ResourceIcon={ResourceIcon} />

              <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                <Markdown
                  className={`text-xs ${isOperating ? 'pointer-events-auto' : 'pointer-events-none'}`}
                  content={data.contentPreview || t('canvas.nodePreview.resource.noContentPreview')}
                />
              </div>

              <div className="flex justify-end items-center flex-shrink-0 mt-2 text-[10px] text-gray-400 z-20">
                {time(data.createdAt, language as LOCALE)
                  ?.utc()
                  ?.fromNow()}
              </div>
            </div>

            {!isPreview && !hideHandles && (
              <>
                <CustomHandle
                  type="target"
                  position={Position.Left}
                  isConnected={isTargetConnected}
                  isNodeHovered={isHovered}
                  nodeType="resource"
                />
                <CustomHandle
                  type="source"
                  position={Position.Right}
                  isConnected={isSourceConnected}
                  isNodeHovered={isHovered}
                  nodeType="resource"
                />
              </>
            )}
          </div>
        </div>

        {!isPreview && selected && (
          <Moveable
            target={targetRef}
            resizable={true}
            edge={false}
            throttleResize={1}
            renderDirections={['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se']}
            onResizeStart={({ setOrigin, dragStart }) => {
              setOrigin(['%', '%']);
              if (dragStart && dragStart instanceof MouseEvent) {
                dragStart.preventDefault();
              }
            }}
            onResize={({ target, width, height, direction }) => {
              const newWidth = Math.max(100, width);
              const newHeight = Math.max(80, height);

              const htmlTarget = target as HTMLElement;
              let newLeft = htmlTarget.offsetLeft;
              let newTop = htmlTarget.offsetTop;

              if (direction[0] === -1) {
                newLeft = htmlTarget.offsetLeft - (newWidth - htmlTarget.offsetWidth);
              }
              if (direction[1] === -1) {
                newTop = htmlTarget.offsetTop - (newHeight - htmlTarget.offsetHeight);
              }

              htmlTarget.style.width = `${newWidth}px`;
              htmlTarget.style.height = `${newHeight}px`;
              htmlTarget.style.left = `${newLeft}px`;
              htmlTarget.style.top = `${newTop}px`;

              setSize({ width: newWidth, height: newHeight });
            }}
            hideDefaultLines={true}
            className={`!pointer-events-auto ${!isHovered ? 'moveable-control-hidden' : 'moveable-control-show'}`}
          />
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.id === nextProps.id &&
      prevProps.selected === nextProps.selected &&
      prevProps.isPreview === nextProps.isPreview &&
      prevProps.hideActions === nextProps.hideActions &&
      prevProps.hideHandles === nextProps.hideHandles &&
      prevProps.data.title === nextProps.data.title &&
      prevProps.data.contentPreview === nextProps.data.contentPreview &&
      prevProps.data.createdAt === nextProps.data.createdAt &&
      JSON.stringify(prevProps.data.metadata) === JSON.stringify(nextProps.data.metadata)
    );
  },
);
