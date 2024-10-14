import React from 'react';
import { Button } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';

interface HoverMenuProps {
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  selected: boolean;
}

const HoverMenu: React.FC<HoverMenuProps> = ({ onClick, onMouseEnter, onMouseLeave, selected }) => {
  const { t } = useTranslation();
  return (
    <div
      className="refly-selector-hover-menu"
      style={{
        position: 'absolute',
        right: '0',
        background: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        borderRadius: '4px',
        padding: '2px 4px',
      }}
    >
      <Button type="text" onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} size="mini">
        {t('knowledgeBase.context.contentSelectorHoverText')}
      </Button>
    </div>
  );
};

export default HoverMenu;
