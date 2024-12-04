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
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';

export const AddBaseMarkContext = (props: { source: MessageIntentSource }) => {
  const [popoverVisible, setPopoverVisible] = useState(false);
  const { t } = useTranslation();

  const { addNode, removeNode, selectedNodes } = useContextPanelStoreShallow((state) => ({
    addNode: state.addContextItem,
    removeNode: state.removeContextItem,
    selectedNodes: state.contextItems,
  }));

  const handleVisibleChange = (visible: boolean) => {
    setPopoverVisible(visible);
  };

  const handleClose = () => {
    setPopoverVisible(false);
  };

  const handleSelect = (node: CanvasNode) => {
    const selectedNodes = useContextPanelStore.getState().contextItems;

    if (!selectedNodes.find((item) => item.id === node.id)) {
      addNode(node);
    } else {
      removeNode(node.id);
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
          <BaseMarkContextSelector
            source={props.source}
            onClose={handleClose}
            onSelect={handleSelect}
            selectedItems={selectedNodes}
          />
        }
      >
        <Tooltip
          title={selectedNodes?.length > 0 ? t('knowledgeBase.context.addContext') : ''}
          getPopupContainer={getPopupContainer}
        >
          <Button
            icon={<IconPlus />}
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
