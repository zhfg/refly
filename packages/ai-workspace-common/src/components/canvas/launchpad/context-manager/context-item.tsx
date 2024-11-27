import { Button } from 'antd';
import { IconClose } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { getNodeIcon } from './utils/icon';
import { IContextItem } from '@refly-packages/ai-workspace-common/stores/context-panel';
import cn from 'classnames';

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
  const { data } = item ?? {};
  const icon = getNodeIcon(item?.type);

  return (
    <Button
      className={cn(
        'max-w-[200px] h-6 px-1 flex items-center border border-gray-200 rounded transition-all duration-300',
        {
          'border-green-500': isActive,
          'border-red-300 bg-red-50 text-red-500': isLimit,
          'bg-gray-100 border-gray-200': disabled,
          'border-dashed': item?.isPreview,
        },
      )}
      onClick={() => onToggle?.(item)}
    >
      <div className="h-[18px] flex items-center w-full text-xs">
        <span className="flex items-center flex-shrink-0 mr-1">{icon}</span>
        <span
          className={cn('flex-1 whitespace-nowrap overflow-hidden text-ellipsis min-w-0 mr-1', {
            'text-gray-300': disabled,
            'text-red-500': isLimit,
          })}
          title={data?.title ?? ''}
        >
          {data?.title}
        </span>
        <span className="item-type text-gray-500 mr-1">
          {item.isCurrentContext ? t('copilot.contextItem.current') : ''}
          {item?.data?.metadata?.sourceType && t(`copilot.contextItem.${item?.data?.metadata?.sourceType}`)}
        </span>
        {!canNotRemove && (
          <IconClose
            className={cn('flex-shrink-0 text-xs cursor-pointer', {
              'text-gray-300': disabled,
              'text-red-500': isLimit,
            })}
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.(item);
            }}
          />
        )}
      </div>
    </Button>
  );
};
