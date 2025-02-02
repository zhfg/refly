import React from 'react';
import { Button } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { IconCopy, IconSave } from '@arco-design/web-react/icon';

interface HoverMenuProps {
  onClick: () => void;
  onCopy: () => void;
  selected: boolean;
  onMouseEnter?: () => void;
}

const HoverMenu: React.FC<HoverMenuProps> = React.memo(({ onClick, onCopy, onMouseEnter }) => {
  const { t } = useTranslation();

  return (
    <div
      className="fixed z-[10000] transform -translate-x-1/2 transition-opacity duration-300 bg-white border border-gray-100 shadow-lg rounded-lg px-2 py-1 flex gap-2"
      style={{
        background: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        borderRadius: '8px',
        border: '1px solid rgba(0,0,0,0.10)',
        padding: '2px 4px',
        display: 'flex',
        flexDirection: 'row',
      }}
      onMouseEnter={onMouseEnter}
    >
      <div className="bg-white border border-gray-100 shadow-lg rounded-lg px-2 py-1 flex gap-2">
        <Button type="text" onClick={onClick} icon={<IconSave />}>
          <span className="font-medium">{t('extension.floatingSphere.clipSelectedContent')}</span>
        </Button>
        <Button type="text" onClick={onCopy} icon={<IconCopy />}>
          <span className="font-medium">{t('extension.floatingSphere.copySelectedContent')}</span>
        </Button>
      </div>
    </div>
  );
});

export default HoverMenu;
