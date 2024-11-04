import React, { useState } from 'react';
import { Button, Popover } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import { BaseMarkContextSelector } from '../base-mark-context-selector';
import './index.scss';
import { Mark } from '@refly/common-types';

export const AddBaseMarkContext = ({
  handleAddItem,
  selectedItems,
}: {
  handleAddItem: (newMark: Mark) => void;
  selectedItems: Mark[];
}) => {
  const [popoverVisible, setPopoverVisible] = useState(false);

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
        <Button
          icon={<IconPlus />}
          size="mini"
          type="outline"
          className="text-xs h-6 rounded border border-gray-300"
          style={{ borderColor: '#e5e5e5', color: 'rgba(0,0,0,0.6)' }}
        />
      </Popover>
    </div>
  );
};
