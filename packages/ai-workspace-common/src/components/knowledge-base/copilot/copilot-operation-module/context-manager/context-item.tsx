import React from 'react';
import { Button } from '@arco-design/web-react';
import { IconClose, IconDelete } from '@arco-design/web-react/icon';
import { Mark } from '@refly/common-types';
import { useTranslation } from 'react-i18next';

export const ContextItem = ({
  item,
  isLimit,
  isActive,
  disabled,
  onToggle,
  onRemove,
}: {
  item: Mark;
  isActive: boolean;
  isLimit?: boolean;
  disabled?: boolean;
  onToggle: any;
  onRemove: any;
}) => {
  const { t } = useTranslation();
  return (
    <div
      className={`context-item ${isActive ? 'active' : isLimit ? 'limit' : disabled ? 'disabled' : ''}`}
      onClick={() => onToggle(item.id)}
    >
      <div className="item-content">
        <span className="item-icon">{item.icon}</span>
        <span className="item-title" title={item.title}>
          {item.title}
        </span>
        <span className="item-type">
          {item.isCurrentContext ? t('copilot.contextItem.current') : ''}
          {item?.name}
        </span>
        <IconClose
          className="item-close"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
        />
      </div>
    </div>
  );
};
