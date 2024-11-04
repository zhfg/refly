import React, { useState } from 'react';
import { Button, Popover, Tooltip } from '@arco-design/web-react';
import { Badge } from 'antd';
import { IconPlus } from '@arco-design/web-react/icon';
import { BaseMarkContextSelector } from '../base-mark-context-selector';
import './index.scss';
import { Mark } from '@refly/common-types';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { useTranslation } from 'react-i18next';
import { useProcessContextItems } from '../../hooks/use-process-context-items';
import { useContextPanelStoreShallow } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { backendBaseMarkTypes, BaseMarkType, frontendBaseMarkTypes } from '@refly/common-types';

export const AddBaseMarkContext = () => {
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
    console.log('newMark', newMark);
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

  const handleVisibleChange = (visible) => {
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
      <div className="add-base-mark-context">
        <Popover
          position="bottom"
          trigger="click"
          className="add-base-mark-context-popover"
          popupVisible={popoverVisible}
          onVisibleChange={handleVisibleChange}
          content={
            <BaseMarkContextSelector onClose={handleClose} onSelect={handleSelect} selectedItems={selectedItems} />
          }
        >
          <Tooltip content={t('knowledgeBase.context.addContext')} getPopupContainer={getPopupContainer}>
            <Button
              icon={<IconPlus style={{ fontSize: 10 }} />}
              size="mini"
              type="outline"
              style={{ fontSize: 10, height: 18, borderRadius: 4, borderColor: '#e5e5e5', color: 'rgba(0,0,0,0.6)' }}
            />
          </Tooltip>
        </Popover>
      </div>
    </Badge>
  );
};
