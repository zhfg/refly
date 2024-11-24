import { useEffect, useState, useCallback } from 'react';
import { Button, Input, Popover, Empty, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { SearchDomain } from '@refly/openapi-schema';
import { DataFetcher } from '@refly-packages/ai-workspace-common/modules/entity-selector/utils';
import { useFetchOrSearchList } from '@refly-packages/ai-workspace-common/modules/entity-selector/hooks';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { IconResource } from '@refly-packages/ai-workspace-common/components/common/icon';
import { ContextItem } from '@refly-packages/ai-workspace-common/types/context';
import throttle from 'lodash.throttle';
import { IconCheck } from '@arco-design/web-react/icon';

interface SearchListProps {
  domain: SearchDomain;
  fetchData?: DataFetcher;
  defaultValue?: any;
  children?: React.ReactNode;
  handleConfirm?: (selectedItems: ContextItem[]) => void;
  className?: string;
  trigger?: 'click' | 'hover';
  mode?: 'multiple' | 'single';
}

export const SearchList = (props: SearchListProps) => {
  const { t } = useTranslation();
  const { domain, fetchData, defaultValue, children, handleConfirm, mode = 'multiple', ...selectProps } = props;

  const { loadMore, dataList, setDataList, isRequesting, handleValueChange, resetState, hasMore } =
    useFetchOrSearchList({
      domain,
      fetchData,
      pageSize: 20,
    });

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<any>(defaultValue);
  const [selectedItems, setSelectedItems] = useState<ContextItem[]>([]);

  const sortedItems: ContextItem[] = [
    ...selectedItems,
    ...(dataList?.filter((item) => !selectedItems.some((selected) => selected.id === item.id)) || []),
  ].map((item) => ({
    ...item,
    isSelected: selectedItems.some((selected) => selected.id === item.id),
  }));

  const handlePopupScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { currentTarget } = e;
    // 检查是否滚动到底部附近(距离底部20px内)
    if (currentTarget.scrollTop + currentTarget.clientHeight >= currentTarget.scrollHeight - 20) {
      loadMore();
    }
  };

  const throttledValueChange = useCallback(
    throttle((value: string) => {
      handleValueChange(value, [domain]);
    }, 300),
    [domain, handleValueChange],
  );

  const handleSearchValueChange = (value: string) => {
    setValue(value);
    throttledValueChange(value);
  };

  const handleItemClick = (item: ContextItem) => {
    if (mode === 'single') {
      handleConfirm?.([item]);
      setOpen(false);
    } else {
      setSelectedItems((prev) => {
        const isSelected = prev.some((selected) => selected.id === item.id);
        if (isSelected) {
          return prev.filter((selected) => selected.id !== item.id);
        } else {
          return [item, ...prev];
        }
      });
    }
  };

  const cancel = () => {
    setOpen(false);
  };

  const confirm = () => {
    handleConfirm?.(selectedItems);
    setOpen(false);
  };

  useEffect(() => {
    if (open) {
      loadMore();
      return () => {
        setSelectedItems([]);
        setValue('');
        resetState();
      };
    }
  }, [open]);

  return (
    <Popover
      content={
        <div className={`flex flex-col gap-2 ${props?.className || ''}`}>
          <Input
            className="text-xs"
            placeholder={t('canvas.contextList.placeholder', { domain: t(`common.${domain}`) })}
            onChange={(e) => handleSearchValueChange(e.target.value)}
          />
          <div className="flex flex-col w-[260px] h-[200px] overflow-y-auto" onScroll={handlePopupScroll}>
            {sortedItems?.map((option) => (
              <div
                key={option.id}
                className={`flex items-center gap-2 p-1 cursor-pointer hover:bg-gray-100 ${option.isSelected ? 'text-[#00968F]' : ''}`}
                onClick={() => handleItemClick(option)}
              >
                <div className="flex-shrink-0">
                  <IconResource className="flex justify-center items-center w-4 h-4" />
                </div>
                {option.title}
                {mode === 'multiple' && option.isSelected && (
                  <div className="ml-auto">
                    <IconCheck className="text-[#00968F] w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isRequesting && (
              <div className="flex items-center justify-center py-4">
                <AiOutlineLoading3Quarters className="animate-spin text-[#00968F]" />
              </div>
            )}

            {!hasMore && sortedItems.length > 0 && (
              <Divider dashed plain className="my-2 px-8">
                <div className="text-xs text-gray-400">{t('common.noMoreText')}</div>
              </Divider>
            )}

            {sortedItems.length === 0 && !isRequesting && (
              <Empty
                className="flex-grow text-xs flex flex-col items-center justify-center"
                imageStyle={{ width: 80, height: 80 }}
                description={t('common.empty')}
              />
            )}
          </div>

          {mode === 'multiple' && (
            <div className="pt-2 flex justify-end items-center gap-2 border-solid border-t-1 border-x-0 border-b-0 border-[#E5E5E5]">
              <Button size="small" className="text-xs" onClick={cancel}>
                {t('common.cancel')}
              </Button>
              <Button
                type="primary"
                size="small"
                className="text-xs"
                disabled={selectedItems.length === 0}
                onClick={confirm}
              >
                {t('common.confirm')}
              </Button>
            </div>
          )}
        </div>
      }
      trigger={props?.trigger || 'click'}
      placement="right"
      open={open}
      onOpenChange={setOpen}
    >
      {children}
    </Popover>
  );
};
