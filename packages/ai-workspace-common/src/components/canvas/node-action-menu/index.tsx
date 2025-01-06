import { Button, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { FC, useCallback, useMemo, useEffect, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  IconRerun,
  IconDelete,
  IconAskAI,
  IconLoading,
  IconRun,
  IconPreview,
  IconExpand,
  IconShrink,
} from '@refly-packages/ai-workspace-common/components/common/icon';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { FileInput, MessageSquareDiff, FilePlus, Ungroup, Group, MoveVertical } from 'lucide-react';
import { GrClone } from 'react-icons/gr';
import { locateToNodePreviewEmitter } from '@refly-packages/ai-workspace-common/events/locateToNodePreview';
import { nodeActionEmitter, createNodeEventName } from '@refly-packages/ai-workspace-common/events/nodeActions';
import { useDocumentStoreShallow } from '@refly-packages/ai-workspace-common/stores/document';
import { CanvasNodeType } from '@refly/openapi-schema';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';
import { useUngroupNodes } from '@refly-packages/ai-workspace-common/hooks/canvas/use-batch-nodes-selection/use-ungroup-nodes';
import { useNodeOperations } from '@refly-packages/ai-workspace-common/hooks/canvas/use-node-operations';

interface MenuItem {
  key: string;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  loading?: boolean;
  danger?: boolean;
  primary?: boolean;
  type: 'button' | 'divider';
  disabled?: boolean;
}

interface NodeActionMenuProps {
  nodeId: string;
  nodeType: CanvasNodeType;
  onClose?: () => void;
  isProcessing?: boolean;
  isCompleted?: boolean;
  isCreatingDocument?: boolean;
  isMultiSelection?: boolean;
}

export const NodeActionMenu: FC<NodeActionMenuProps> = ({ nodeId, nodeType, onClose, isMultiSelection }) => {
  const { t } = useTranslation();
  const { getNode } = useReactFlow();
  const { canvasId } = useCanvasContext();
  const { setNodeSizeMode } = useNodeOperations();

  const { activeDocumentId } = useDocumentStoreShallow((state) => ({
    activeDocumentId: state.activeDocumentId,
  }));

  const node = useMemo(() => getNode(nodeId) as CanvasNode, [nodeId, getNode]);
  const nodeData = useMemo(() => node?.data, [node]);
  const [localSizeMode, setLocalSizeMode] = useState(() => nodeData?.metadata?.sizeMode || 'adaptive');

  useEffect(() => {
    setLocalSizeMode(nodeData?.metadata?.sizeMode || 'adaptive');
  }, [nodeData?.metadata?.sizeMode]);

  const addNodePreview = useCanvasStoreShallow((state) => state.addNodePreview);
  const { ungroupNodes } = useUngroupNodes();

  const handleAskAI = useCallback(() => {
    nodeActionEmitter.emit(createNodeEventName(nodeId, 'askAI'));
    onClose?.();
  }, [nodeId, onClose]);

  const handleRun = useCallback(() => {
    nodeActionEmitter.emit(createNodeEventName(nodeId, 'run'));
    onClose?.();
  }, [nodeId]);

  const handleCloneAskAI = useCallback(() => {
    nodeActionEmitter.emit(createNodeEventName(nodeId, 'cloneAskAI'));
    onClose?.();
  }, [nodeId, onClose]);

  const handleRerun = useCallback(() => {
    nodeActionEmitter.emit(createNodeEventName(nodeId, 'rerun'));
    onClose?.();
  }, [nodeId]);

  const handleDelete = useCallback(() => {
    nodeActionEmitter.emit(createNodeEventName(nodeId, 'delete'));
    onClose?.();
  }, [nodeId]);

  const handleAddToContext = useCallback(() => {
    nodeActionEmitter.emit(createNodeEventName(nodeId, 'addToContext'));
    onClose?.();
  }, [nodeId]);

  const handleCreateDocument = useCallback(() => {
    nodeActionEmitter.emit(createNodeEventName(nodeId, 'createDocument'));
    onClose?.();
  }, [nodeId]);

  const handleInsertToDoc = useCallback(() => {
    nodeActionEmitter.emit(createNodeEventName(nodeId, 'insertToDoc'), {
      content: nodeData?.contentPreview,
    });
    onClose?.();
  }, [nodeId, nodeData?.contentPreview]);

  const handlePreview = useCallback(() => {
    console.log('handlePreview', nodeId, canvasId);
    addNodePreview(canvasId, node);
    locateToNodePreviewEmitter.emit('locateToNodePreview', { id: nodeId, canvasId });
    onClose?.();
  }, [node, nodeId, canvasId]);

  const handleUngroup = useCallback(() => {
    ungroupNodes(nodeId);
    onClose?.();
  }, [ungroupNodes, nodeId, onClose]);

  const handleToggleSizeMode = useCallback(() => {
    const newMode = localSizeMode === 'compact' ? 'adaptive' : 'compact';
    setLocalSizeMode(newMode);
    setNodeSizeMode(nodeId, newMode);
    onClose?.();
  }, [nodeId, localSizeMode, setNodeSizeMode, onClose]);

  const getMenuItems = (activeDocumentId: string): MenuItem[] => {
    if (isMultiSelection) {
      return [
        {
          key: 'askAI',
          icon: IconAskAI,
          label: t('canvas.nodeActions.askAI'),
          onClick: handleAskAI,
          type: 'button' as const,
          primary: true,
        },
        { key: 'divider-1', type: 'divider' } as MenuItem,
        {
          key: 'addToContext',
          icon: MessageSquareDiff,
          label: t('canvas.nodeActions.addToContext'),
          onClick: handleAddToContext,
          type: 'button' as const,
        },
        { key: 'divider-2', type: 'divider' } as MenuItem,
        {
          key: 'delete',
          icon: IconDelete,
          label: t('canvas.nodeActions.delete'),
          onClick: handleDelete,
          danger: true,
          type: 'button' as const,
        },
      ];
    }

    const baseItems: MenuItem[] = [
      {
        key: 'askAI',
        icon: IconAskAI,
        label: t('canvas.nodeActions.askAI'),
        onClick: handleAskAI,
        type: 'button' as const,
        primary: true,
      },
      nodeType === 'skillResponse'
        ? {
            key: 'cloneAskAI',
            icon: GrClone,
            label: t('canvas.nodeActions.cloneAskAI'),
            onClick: handleCloneAskAI,
            type: 'button' as const,
          }
        : null,
      { key: 'divider-1', type: 'divider' } as MenuItem,
      {
        key: 'preview',
        icon: IconPreview,
        label: t('canvas.nodeActions.preview'),
        onClick: handlePreview,
        type: 'button' as const,
      },
      {
        key: 'toggleSizeMode',
        icon: localSizeMode === 'compact' ? IconExpand : IconShrink,
        label: localSizeMode === 'compact' ? t('canvas.nodeActions.adaptiveMode') : t('canvas.nodeActions.compactMode'),
        onClick: handleToggleSizeMode,
        type: 'button' as const,
      },
    ].filter(Boolean);

    const nodeTypeItems: Record<string, MenuItem[]> = {
      document: [
        {
          key: 'addToContext',
          icon: MessageSquareDiff,
          label: t('canvas.nodeActions.addToContext'),
          onClick: handleAddToContext,
          type: 'button' as const,
        },
      ],
      resource: [
        {
          key: 'addToContext',
          icon: MessageSquareDiff,
          label: t('canvas.nodeActions.addToContext'),
          onClick: handleAddToContext,
          type: 'button' as const,
        },
      ],
      memo: [
        {
          key: 'insertToDoc',
          icon: FileInput,
          label: t('canvas.nodeActions.insertToDoc'),
          onClick: handleInsertToDoc,
          type: 'button' as const,
          disabled: !activeDocumentId,
        },
      ],
      group: [
        {
          key: 'addToContext',
          icon: MessageSquareDiff,
          label: t('canvas.nodeActions.addToContext'),
          onClick: handleAddToContext,
          type: 'button' as const,
        },
        {
          key: 'ungroup',
          icon: Ungroup,
          label: t('canvas.nodeActions.ungroup'),
          onClick: handleUngroup,
          type: 'button' as const,
        },
      ],
      skill: [
        {
          key: 'run',
          icon: IconRun,
          label: t('canvas.nodeActions.run'),
          onClick: handleRun,
          type: 'button' as const,
        },
      ],
      skillResponse: [
        {
          key: 'rerun',
          icon: IconRerun,
          label: t('canvas.nodeActions.rerun'),
          onClick: handleRerun,
          type: 'button' as const,
        },
        {
          key: 'insertToDoc',
          icon: FileInput,
          label: t('canvas.nodeActions.insertToDoc'),
          onClick: handleInsertToDoc,
          type: 'button' as const,
          disabled: !activeDocumentId,
        },
        {
          key: 'addToContext',
          icon: MessageSquareDiff,
          label: t('canvas.nodeActions.addToContext'),
          onClick: handleAddToContext,
          type: 'button' as const,
        },
        nodeData?.contentPreview
          ? {
              key: 'createDocument',
              icon: FilePlus,
              label: t('canvas.nodeStatus.createDocument'),
              onClick: handleCreateDocument,
              type: 'button' as const,
            }
          : null,
      ].filter(Boolean),
    };

    const deleteItem: MenuItem = {
      key: 'delete',
      icon: IconDelete,
      label: t('canvas.nodeActions.delete'),
      onClick: handleDelete,
      danger: true,
      type: 'button' as const,
    };

    return [
      ...(nodeType !== 'memo' && nodeType !== 'skill' ? baseItems : []),
      ...(nodeTypeItems[nodeType] || []),
      { key: 'divider-2', type: 'divider' } as MenuItem,
      deleteItem,
    ];
  };

  const menuItems = useMemo(
    () => getMenuItems(activeDocumentId),
    [
      activeDocumentId,
      nodeType,
      nodeData?.contentPreview,
      handleRerun,
      handleDelete,
      handleAddToContext,
      handleCreateDocument,
      handleInsertToDoc,
      handlePreview,
      t,
      localSizeMode,
      handleToggleSizeMode,
    ],
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-2 w-[200px] border border-[rgba(0,0,0,0.06)]">
      {menuItems.map((item) => {
        if (item.type === 'divider') {
          return <Divider key={item.key} className="my-1 h-[1px] bg-gray-100" />;
        }

        return (
          <Button
            key={item.key}
            className={`
              w-full
              h-8
              flex
              items-center
              gap-2
              px-2
              rounded
              text-sm
              transition-colors
              text-gray-700 hover:bg-gray-50 hover:text-gray-700
              ${item.danger ? '!text-red-600 hover:bg-red-50' : ''}
              ${item.primary ? '!text-primary-600 hover:bg-primary-50' : ''}
              ${item.loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            type="text"
            loading={item.loading}
            onClick={item.onClick}
            disabled={item.disabled}
          >
            {item.loading ? <IconLoading className="w-4 h-4" /> : <item.icon className="w-4 h-4" />}
            <span className="flex-1 text-left truncate">{item.label}</span>
          </Button>
        );
      })}
    </div>
  );
};
