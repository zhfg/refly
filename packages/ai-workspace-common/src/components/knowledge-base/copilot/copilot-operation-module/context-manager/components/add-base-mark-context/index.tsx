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
          icon={<IconPlus style={{ fontSize: 10 }} />}
          size="mini"
          type="outline"
          style={{ fontSize: 10, height: 18, borderRadius: 4, borderColor: '#e5e5e5', color: 'rgba(0,0,0,0.6)' }}
        />
      </Popover>
    </div>
  );
};
