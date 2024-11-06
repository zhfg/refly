import React, { useState } from 'react';
import { Button, Popover, Tooltip } from 'antd';
import { Badge } from 'antd';
import { IconPlus } from '@arco-design/web-react/icon';
import { BaseMarkContextSelector } from '../base-mark-context-selector';
import { Mark } from '@refly/common-types';
import { useTranslation } from 'react-i18next';
import { useProcessContextItems } from '../../hooks/use-process-context-items';
import { useContextPanelStoreShallow } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { backendBaseMarkTypes, BaseMarkType, frontendBaseMarkTypes } from '@refly/common-types';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';

export const AddBaseMarkContext = (props: { source: MessageIntentSource }) => {
  const [popoverVisible, setPopoverVisible] = useState(false);
  const { t } = useTranslation();

  const { processedContextItems } = useProcessContextItems();
  const { addMark, removeMark, currentSelectedMarks } = useContextPanelStoreShallow((state) => ({
    addMark: state.addMark,
    removeMark: state.removeMark,
    toggleMarkActive: state.toggleMarkActive,
    clearMarks: state.clearMarks,
    updateMark: state.updateMark,
    currentSelectedMarks: state.currentSelectedMarks,
    filterIdsOfCurrentSelectedMarks: state.filterIdsOfCurrentSelectedMarks,
    filterErrorInfo: state.filterErrorInfo,
  }));

  const selectedItems = processedContextItems?.filter((item) =>
    [...backendBaseMarkTypes, ...frontendBaseMarkTypes].includes(item?.type as BaseMarkType),
  );

  const handleAddItem = (newMark: Mark) => {
    // 检查项目是否已经存在于 store 中
    const existingMark = currentSelectedMarks.find((mark) => mark.id === newMark.id && mark.type === newMark.type);

    if (!existingMark) {
      // 如果项目不存在，添加到 store

      addMark(newMark);
    } else {
      removeMark(existingMark.id);
      // 如果项目已存在，可以选择更新它或者不做任何操作
      // 这里我们选择不做任何操作，但您可以根据需求进行调整
      console.log('Item already exists in the store');
    }
  };

  const handleVisibleChange = (visible: boolean) => {
    setPopoverVisible(visible);
  };

  const handleClose = () => {
    setPopoverVisible(false);
  };

  const handleSelect = (newMark: Mark) => {
    handleAddItem(newMark);
  };

  return (
    <Badge count={(selectedItems || []).length} size="small" color="#00968F" style={{ zIndex: 1000 }}>
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
            selectedItems={selectedItems}
          />
        }
      >
        <Tooltip
          title={selectedItems?.length > 0 ? t('knowledgeBase.context.addContext') : ''}
          getPopupContainer={getPopupContainer}
        >
          <Button
            icon={<IconPlus />}
            size="small"
            type="default"
            className="text-xs h-6 rounded border text-gray-500 gap-1"
          >
            {selectedItems?.length === 0 ? t('copilot.addContext') : null}
          </Button>
        </Tooltip>
      </Popover>
    </Badge>
  );
};
