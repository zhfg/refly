import { Button } from 'antd';
import { IconClose } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { getNodeIcon } from './utils/icon';
import { IContextItem } from '@refly-packages/ai-workspace-common/stores/context-panel';

export const ContextItem = ({
  item,
  isLimit,
  isActive,
  disabled,
  onToggle,
  onRemove,
  canNotRemove,
}: {
  canNotRemove?: boolean;
  item: IContextItem;
  isActive: boolean;
  isLimit?: boolean;
  disabled?: boolean;
  onToggle: (item: IContextItem) => void;
  onRemove?: (item: IContextItem) => void;
}) => {
  const { t } = useTranslation();
  const { data } = item;
  const icon = getNodeIcon(item.type);

  return (
    <Button
      className={`context-item ${isActive ? 'active' : isLimit ? 'limit' : disabled ? 'disabled' : ''}`}
      onClick={() => onToggle(item)}
    >
      <div className="item-content">
        <span className="item-icon">{icon}</span>
        <span className="item-title" title={data.title}>
          {data.title}
        </span>
        {/* <span className="item-type">
          {item.isCurrentContext ? t('copilot.contextItem.current') : ''}
          {data.title}
        </span> */}
        {!canNotRemove && (
          <IconClose
            className="item-close"
            onClick={(e) => {
              e.stopPropagation();
              onRemove && onRemove(item);
            }}
          />
        )}
      </div>
    </Button>
  );
};
