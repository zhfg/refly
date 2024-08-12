import React from 'react';
import { Button } from '@arco-design/web-react';
import { IconDelete } from '@arco-design/web-react/icon';

interface HoverMenuProps {
  onDelete: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const HoverMenu: React.FC<HoverMenuProps> = ({ onDelete, onMouseEnter, onMouseLeave }) => {
  return (
    <div
      className="hover-menu"
      style={{
        position: 'absolute',
        right: '0',
        background: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        borderRadius: '4px',
        padding: '2px 4px',
      }}
    >
      <Button
        type="text"
        icon={<IconDelete />}
        onClick={onDelete}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        size="mini"
      />
    </div>
  );
};

export default HoverMenu;
