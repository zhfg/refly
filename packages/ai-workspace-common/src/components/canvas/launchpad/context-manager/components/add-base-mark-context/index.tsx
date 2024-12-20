import { useState } from 'react';
import { Badge, Button, Popover, Tooltip } from 'antd';
import { IconPlus } from '@arco-design/web-react/icon';
import { BaseMarkContextSelector } from '../base-mark-context-selector';
import { useTranslation } from 'react-i18next';
import {
  useContextPanelStore,
  useContextPanelStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/context-panel';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { useAddToChatHistory } from '@refly-packages/ai-workspace-common/hooks/use-add-to-chat-history';
import { useChatHistory } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/hooks/use-chat-history';

export const AddBaseMarkContext = () => {
  const [popoverVisible, setPopoverVisible] = useState(false);
  const { t } = useTranslation();

  const { addNode, removeNode, selectedNodes } = useContextPanelStoreShallow((state) => ({
    addNode: state.addContextItem,
    removeNode: state.removeContextItem,
    selectedNodes: state.contextItems,
  }));
  const { handleItemAdd, handleItemDelete } = useChatHistory();

  const handleVisibleChange = (visible: boolean) => {
    setPopoverVisible(visible);
  };

  const handleClose = () => {
    setPopoverVisible(false);
  };

  const handleSelect = (node: CanvasNode) => {
    const contextStore = useContextPanelStore.getState();
    const selectedNodes = contextStore.contextItems;
    const isSelected = selectedNodes.find((item) => item.id === node.id);

    if (!isSelected) {
      // Adding node
      addNode(node);

      // If it's a skill response node, add to chat history
      if (node.type === 'skillResponse') {
        handleItemAdd(node);
      }
    } else {
      // Removing node
      removeNode(node.id);

      // If it's a skill response node, remove from chat history
      if (node.type === 'skillResponse') {
        handleItemDelete(node);
      }
    }
  };

  return (
    <Badge count={(selectedNodes || []).length} size="small" color="#00968F" style={{ zIndex: 1000 }}>
      <Popover
        placement="bottom"
        trigger="click"
        overlayInnerStyle={{ padding: 0, boxShadow: 'none' }}
        open={popoverVisible}
        onOpenChange={handleVisibleChange}
        content={
          <BaseMarkContextSelector onClose={handleClose} onSelect={handleSelect} selectedItems={selectedNodes} />
        }
      >
        <Tooltip
          title={selectedNodes?.length > 0 ? t('knowledgeBase.context.addContext') : ''}
          getPopupContainer={getPopupContainer}
        >
          <Button
            icon={<IconPlus className="w-3 h-3" />}
            size="small"
            type="default"
            className="text-xs h-6 rounded border text-gray-500 gap-1"
          >
            {selectedNodes?.length === 0 ? t('copilot.addContext') : null}
          </Button>
        </Tooltip>
      </Popover>
    </Badge>
  );
};
