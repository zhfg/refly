import { Button, Popover } from 'antd';
import { IconClose } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { getNodeIcon } from './utils/icon';
import { IContextItem } from '@refly-packages/ai-workspace-common/stores/context-panel';
import cn from 'classnames';
import { ContextPreview } from './context-preview';

export const ContextItem = ({
  item,
  isLimit,
  isActive,
  disabled,
  onClick,
  onRemove,
  canNotRemove,
  onOpenUrl,
}: {
  canNotRemove?: boolean;
  item: IContextItem;
  isActive: boolean;
  isLimit?: boolean;
  disabled?: boolean;
  onClick: (item: IContextItem) => void;
  onRemove?: (item: IContextItem) => void;
  onOpenUrl: (url: string | (() => string) | (() => void)) => void;
}) => {
  const { t } = useTranslation();
  const { data } = item ?? {};
  const icon = getNodeIcon(item?.type);

  const content = (
    <div>
      <ContextPreview item={item} />
    </div>
  );

  return (
    <Popover
      arrow={false}
      content={content}
      trigger="hover"
      placement="bottom"
      overlayClassName="context-preview-popover"
    >
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
        onClick={() => onClick?.(item)}
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
            {t(`copilot.contextItem.${item?.data?.metadata?.sourceType || item?.type}`)}
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
    </Popover>
  );
};
