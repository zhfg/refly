import { Button, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { FC, useCallback, useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { IconDelete, IconAskAI, IconLoading } from '@refly-packages/ai-workspace-common/components/common/icon';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { MessageSquareDiff, Group } from 'lucide-react';
import { genSkillID } from '@refly-packages/utils/id';
import { CanvasNodeType } from '@refly/openapi-schema';
import { useAddNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-add-node';
import { useGroupNodes } from '@refly-packages/ai-workspace-common/hooks/canvas/use-batch-nodes-selection/use-group-nodes';
import { useAddToContext } from '@refly-packages/ai-workspace-common/hooks/canvas/use-add-to-context';
import { useDeleteNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-delete-node';
import { useAddToChatHistory } from '@refly-packages/ai-workspace-common/hooks/canvas/use-add-to-chat-history';

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

interface SelectionActionMenuProps {
  onClose?: () => void;
}

export const SelectionActionMenu: FC<SelectionActionMenuProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { getNodes } = useReactFlow();
  const { canvasId } = useCanvasContext();
  const { addNode } = useAddNode(canvasId);
  const { createGroupFromSelectedNodes } = useGroupNodes();
  const { addNodesToContext } = useAddToContext();
  const { deleteNodes } = useDeleteNode();
  const { addNodesToHistory } = useAddToChatHistory();

  const handleAskAI = useCallback(() => {
    // Get all selected nodes except skills
    const selectedNodes = getNodes().filter((node) => node.selected && !['skill', 'memo'].includes(node.type));

    const connectTo = selectedNodes.map((node) => ({
      type: node.type as CanvasNodeType,
      entityId: node.data.entityId as string,
    }));

    // Only proceed if there are non-skill nodes selected
    if (selectedNodes.length > 0) {
      addNode(
        {
          type: 'skill',
          data: {
            title: 'Skill',
            entityId: genSkillID(),
            metadata: {
              contextNodeIds: selectedNodes.map((node) => node.id),
            },
          },
        },
        connectTo,
      );
    }

    onClose?.();
  }, [getNodes, addNode, onClose]);

  const handleAddToContext = useCallback(() => {
    const selectedNodes = getNodes()
      .filter((node) => node.selected)
      .map((node) => ({
        id: node.id,
        type: node.type,
        data: node.data,
        position: node.position,
      })) as CanvasNode[];

    // Add all selected nodes to context
    addNodesToContext(selectedNodes);

    // Add skill response nodes to chat history
    const skillResponseNodes = selectedNodes.filter((node) => node.type === 'skillResponse');
    if (skillResponseNodes.length > 0) {
      addNodesToHistory(skillResponseNodes, { showMessage: false });
    }

    onClose?.();
  }, [getNodes, addNodesToContext, addNodesToHistory, onClose]);

  const handleDelete = useCallback(() => {
    const selectedNodes = getNodes()
      .filter((node) => node.selected)
      .map((node) => ({
        id: node.id,
        type: node.type,
        data: node.data,
        position: node.position,
      })) as CanvasNode[];

    deleteNodes(selectedNodes);
    onClose?.();
  }, [getNodes, deleteNodes, onClose]);

  const handleGroup = useCallback(() => {
    createGroupFromSelectedNodes();
    onClose?.();
  }, [createGroupFromSelectedNodes, onClose]);

  const getMenuItems = (): MenuItem[] => {
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
        key: 'group',
        icon: Group,
        label: t('canvas.nodeActions.group'),
        onClick: handleGroup,
        type: 'button' as const,
      },
      {
        key: 'delete',
        icon: IconDelete,
        label: t('canvas.nodeActions.deleteAll'),
        onClick: handleDelete,
        danger: true,
        type: 'button' as const,
      },
    ];
  };

  const menuItems = useMemo(() => getMenuItems(), []);

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
