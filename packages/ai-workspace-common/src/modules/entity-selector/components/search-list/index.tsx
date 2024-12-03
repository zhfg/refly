import React, { useEffect, useState, useCallback } from 'react';
import { Button, Input, Popover, Empty, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { SearchDomain } from '@refly/openapi-schema';
import { DataFetcher } from '@refly-packages/ai-workspace-common/modules/entity-selector/utils';
import { useFetchOrSearchList } from '@refly-packages/ai-workspace-common/modules/entity-selector/hooks';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { ContextItem } from '@refly-packages/ai-workspace-common/types/context';
import throttle from 'lodash.throttle';
import { IconCheck } from '@arco-design/web-react/icon';
import { FileText, Link2, MessageSquare, Sparkles, Wrench, Cpu, Code2, Globe } from 'lucide-react';
import { SkillAvatar } from '@refly-packages/ai-workspace-common/components/skill/skill-avatar';

interface SearchListProps {
  domain: SearchDomain;
  fetchData?: DataFetcher;
  defaultValue?: any;
  children?: React.ReactNode;
  handleConfirm?: (selectedItems: ContextItem[]) => void;
  className?: string;
  trigger?: 'click' | 'hover';
  mode?: 'multiple' | 'single';
  offset?: number | [number, number];
}

// Define domain colors similar to NODE_COLORS
const DOMAIN_COLORS: Record<SearchDomain, string> = {
  document: '#00968F',
  resource: '#17B26A',
  skill: '#6172F3',
  tool: '#2E90FA',
  canvas: '#00968F',
};

// Get icon component based on domain and metadata
const getDomainIcon = (domain: SearchDomain, metadata?: any) => {
  switch (domain) {
    case 'document':
      return FileText;
    case 'resource':
      return metadata?.resourceType === 'weblink' ? Link2 : FileText;
    case 'skill':
      switch (metadata?.skillType) {
        case 'prompt':
        case 'prompt-struct':
          return Cpu;
        case 'code':
          return Code2;
        case 'http':
          return Globe;
        default:
          const skill = metadata?.originalItem;
          return (
            <SkillAvatar
              noBorder
              size={20}
              icon={skill?.icon}
              displayName={skill?.displayName}
              background="transparent"
            />
          );
      }
    case 'tool':
      return Wrench;
    default:
      return FileText;
  }
};

export const SearchList = (props: SearchListProps) => {
  const { t } = useTranslation();
  const { domain, fetchData, defaultValue, children, handleConfirm, mode = 'multiple', offset, ...selectProps } = props;

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

  const renderItemIcon = (option: ContextItem) => {
    const IconComponent = getDomainIcon(domain as SearchDomain, option.metadata) as React.ComponentType<{
      className?: string;
    }>;
    const backgroundColor = DOMAIN_COLORS[domain as SearchDomain];
    const isReactElement = React.isValidElement(IconComponent);

    return (
      <div
        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: isReactElement ? 'transparent' : backgroundColor,
          border: isReactElement ? `0.5px solid ${backgroundColor}` : 'none',
        }}
      >
        {isReactElement ? IconComponent : <IconComponent className="w-3 h-3 text-white" />}
      </div>
    );
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
                className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 ${
                  option.isSelected ? 'text-[#00968F]' : ''
                }`}
                onClick={() => handleItemClick(option)}
              >
                {renderItemIcon(option)}
                <span className="flex-grow truncate">{option.title}</span>
                {mode === 'multiple' && option.isSelected && (
                  <div className="flex-shrink-0">
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
      arrow={false}
      onOpenChange={setOpen}
      align={{
        offset: [
          typeof offset === 'number' ? offset : Array.isArray(offset) ? offset[0] : 12,
          typeof offset === 'number' ? offset : Array.isArray(offset) ? offset[1] : 0,
        ],
      }}
    >
      {children}
    </Popover>
  );
};
