import { NodeProps, Position, useReactFlow } from '@xyflow/react';
import { CanvasNode, CanvasNodeData, SkillNodeMeta } from './shared/types';
import { Node } from '@xyflow/react';
import { Button } from 'antd';
import { CustomHandle } from './shared/custom-handle';
import { useState, useCallback, useEffect, useMemo, memo } from 'react';

import { getNodeCommonStyles } from './index';
import { ChatInput } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/chat-input';
import { getSkillIcon } from '@refly-packages/ai-workspace-common/components/common/icon';
import { ModelInfo, Skill } from '@refly/openapi-schema';
import { useDebouncedCallback } from 'use-debounce';
import { ChatActions } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/chat-actions';
import { useInvokeAction } from '@refly-packages/ai-workspace-common/hooks/canvas/use-invoke-action';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';
import { useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';
import { useCanvasData } from '@refly-packages/ai-workspace-common/hooks/canvas/use-canvas-data';
import { useNodeHoverEffect } from '@refly-packages/ai-workspace-common/hooks/canvas/use-node-hover';
import { ActionButtons } from './shared/action-buttons';
import { cleanupNodeEvents } from '@refly-packages/ai-workspace-common/events/nodeActions';
import { nodeActionEmitter } from '@refly-packages/ai-workspace-common/events/nodeActions';
import { createNodeEventName } from '@refly-packages/ai-workspace-common/events/nodeActions';
import { useDeleteNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-delete-node';
import { ContextManager } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/context-manager';
import { IContextItem } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { usePatchNodeData } from '@refly-packages/ai-workspace-common/hooks/canvas/use-patch-node-data';
import { useEdgeStyles } from '@refly-packages/ai-workspace-common/components/canvas/constants';
import { genActionResultID } from '@refly-packages/utils/id';
import { useAddNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-add-node';
import { useTranslation } from 'react-i18next';
import { IconClose } from '@arco-design/web-react/icon';
import { convertContextItemsToNodeFilters } from '@refly-packages/ai-workspace-common/utils/map-context-items';

type SkillNode = Node<CanvasNodeData<SkillNodeMeta>, 'skill'>;

// Memoized Header Component
const NodeHeader = memo(
  ({
    query,
    selectedSkillName,
    setSelectedSkill,
  }: {
    query: string;
    selectedSkillName?: string;
    setSelectedSkill: (skill: Skill | null) => void;
  }) => {
    const { t } = useTranslation();
    return (
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#6172F3] shadow-lg flex items-center justify-center flex-shrink-0">
            {getSkillIcon(selectedSkillName, 'w-4 h-4 text-white')}
          </div>
          <span className="text-sm font-medium leading-normal text-[rgba(0,0,0,0.8)] truncate">
            {selectedSkillName ? t(`${selectedSkillName}.name`, { ns: 'skill' }) : t('canvas.skill.askAI')}
          </span>
        </div>
        {selectedSkillName && (
          <Button
            type="text"
            size="small"
            className="p-0"
            icon={<IconClose />}
            onClick={() => {
              setSelectedSkill?.(null);
            }}
          />
        )}
      </div>
    );
  },
);

NodeHeader.displayName = 'NodeHeader';

export const SkillNode = memo(
  ({ data, selected, id }: NodeProps<SkillNode>) => {
    const [isHovered, setIsHovered] = useState(false);
    const { edges } = useCanvasData();
    const patchNodeData = usePatchNodeData();
    const edgeStyles = useEdgeStyles();
    const { getNode, getNodes, getEdges, addEdges, deleteElements } = useReactFlow();
    const { addNode } = useAddNode();
    const { deleteNode } = useDeleteNode();

    const { query, selectedSkill, modelInfo, contextItems = [] } = data.metadata;

    const [localQuery, setLocalQuery] = useState(query);

    // Check if node has any connections
    const isTargetConnected = useMemo(() => edges?.some((edge) => edge.target === id), [edges, id]);
    const isSourceConnected = useMemo(() => edges?.some((edge) => edge.source === id), [edges, id]);

    const updateNodeData = useDebouncedCallback((data: Partial<CanvasNodeData<SkillNodeMeta>>) => {
      patchNodeData(id, data);
    }, 50);

    const { selectedModel } = useChatStoreShallow((state) => ({
      selectedModel: state.selectedModel,
    }));

    const { invokeAction, abortAction } = useInvokeAction();
    const { canvasId } = useCanvasContext();

    const setQuery = useCallback(
      (query: string) => {
        setLocalQuery(query);
        updateNodeData({ title: query, metadata: { query } });
      },
      [id, updateNodeData],
    );

    const setModelInfo = useCallback(
      (modelInfo: ModelInfo | null) => {
        patchNodeData(id, { metadata: { modelInfo } });
      },
      [id, patchNodeData],
    );

    const setContextItems = useCallback(
      (items: IContextItem[]) => {
        patchNodeData(id, { metadata: { contextItems: items } });

        const nodes = getNodes() as CanvasNode<any>[];
        const entityNodeMap = new Map(nodes.map((node) => [node.data?.entityId, node]));
        const contextNodes = items.map((item) => entityNodeMap.get(item.entityId));

        const edges = getEdges();
        const existingEdges = edges?.filter((edge) => edge.target === id) ?? [];
        const existingSourceIds = new Set(existingEdges.map((edge) => edge.source));
        const newSourceNodes = contextNodes.filter((node) => !existingSourceIds.has(node?.id));

        const newEdges = newSourceNodes.map((node) => ({
          id: `${node.id}-${id}`,
          source: node.id,
          target: id,
          style: edgeStyles.hover,
          type: 'default',
        }));

        const contextNodeIds = new Set(contextNodes.map((node) => node?.id));
        const edgesToRemove = existingEdges.filter((edge) => !contextNodeIds.has(edge.source));

        if (newEdges?.length > 0) {
          addEdges(newEdges);
        }

        if (edgesToRemove?.length > 0) {
          deleteElements({ edges: edgesToRemove });
        }
      },
      [id, canvasId, patchNodeData, addEdges, deleteElements, edgeStyles.hover],
    );

    useEffect(() => {
      if (selectedModel && !modelInfo) {
        setModelInfo(selectedModel);
      }
    }, [selectedModel, modelInfo, setModelInfo]);

    const setSelectedSkill = useCallback(
      (skill: Skill | null) => {
        patchNodeData(id, { metadata: { selectedSkill: skill } });
      },
      [id, updateNodeData],
    );

    const { handleMouseEnter: onHoverStart, handleMouseLeave: onHoverEnd } = useNodeHoverEffect(id);

    const handleMouseEnter = useCallback(() => {
      setIsHovered(true);
      onHoverStart();
    }, [onHoverStart]);

    const handleMouseLeave = useCallback(() => {
      setIsHovered(false);
      onHoverEnd();
    }, [onHoverEnd]);

    const handleSendMessage = useCallback(() => {
      const node = getNode(id);
      const data = node?.data as CanvasNodeData<SkillNodeMeta>;
      const { query = '', contextItems = [] } = data?.metadata ?? {};

      deleteElements({ nodes: [node] });

      setTimeout(() => {
        const resultId = genActionResultID();
        invokeAction(
          {
            resultId,
            ...data?.metadata,
          },
          {
            entityId: canvasId,
            entityType: 'canvas',
          },
        );
        addNode(
          {
            type: 'skillResponse',
            data: {
              title: query,
              entityId: resultId,
              metadata: {
                status: 'executing',
                contextItems,
              },
            },
            position: node.position,
          },
          convertContextItemsToNodeFilters(contextItems),
        );
      });
    }, [id, getNode, deleteElements, invokeAction, canvasId, addNode]);

    const handleDelete = useCallback(() => {
      const currentNode = getNode(id);
      deleteNode({
        id,
        type: 'skill',
        data,
        position: currentNode?.position || { x: 0, y: 0 },
      });
    }, [id, data, getNode, deleteNode]);

    useEffect(() => {
      const handleNodeRun = () => handleSendMessage();
      const handleNodeDelete = () => handleDelete();

      nodeActionEmitter.on(createNodeEventName(id, 'run'), handleNodeRun);
      nodeActionEmitter.on(createNodeEventName(id, 'delete'), handleNodeDelete);

      return () => {
        nodeActionEmitter.off(createNodeEventName(id, 'run'), handleNodeRun);
        nodeActionEmitter.off(createNodeEventName(id, 'delete'), handleNodeDelete);
        cleanupNodeEvents(id);
      };
    }, [id, handleSendMessage, handleDelete]);

    return (
      <div className="relative group" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <div className={`w-[384px] max-h-[400px] ${getNodeCommonStyles({ selected, isHovered })}`}>
          <ActionButtons type="skill" nodeId={id} isNodeHovered={isHovered} />

          <CustomHandle
            type="target"
            position={Position.Left}
            isConnected={isTargetConnected}
            isNodeHovered={isHovered}
            nodeType="skill"
          />
          <CustomHandle
            type="source"
            position={Position.Right}
            isConnected={isSourceConnected}
            isNodeHovered={isHovered}
            nodeType="skill"
          />

          <div className="flex flex-col gap-3">
            <NodeHeader
              query={localQuery}
              selectedSkillName={selectedSkill?.name}
              setSelectedSkill={setSelectedSkill}
            />

            <ContextManager className="px-0.5" contextItems={contextItems} setContextItems={setContextItems} />
            <ChatInput
              query={localQuery}
              setQuery={setQuery}
              selectedSkillName={selectedSkill?.name}
              inputClassName="px-1 py-0"
              handleSendMessage={handleSendMessage}
              handleSelectSkill={(skill) => {
                setQuery('');
                setSelectedSkill(skill);
              }}
            />

            <ChatActions
              query={localQuery}
              model={modelInfo}
              setModel={setModelInfo}
              handleSendMessage={handleSendMessage}
              handleAbort={abortAction}
            />
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Optimize re-renders by comparing only necessary props
    return (
      prevProps.id === nextProps.id &&
      prevProps.selected === nextProps.selected &&
      prevProps.data?.title === nextProps.data?.title &&
      JSON.stringify(prevProps.data?.metadata) === JSON.stringify(nextProps.data?.metadata)
    );
  },
);

SkillNode.displayName = 'SkillNode';
