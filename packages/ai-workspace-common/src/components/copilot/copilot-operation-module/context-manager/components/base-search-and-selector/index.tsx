import React, { useEffect, useState } from 'react';
import { Button, Message, Spin } from '@arco-design/web-react';
import './index.scss';

import { Command } from 'cmdk';
import { useSearchStore } from '@refly-packages/ai-workspace-common/stores/search';
import { useDebouncedCallback } from 'use-debounce';
import { defaultFilter } from '@refly-packages/ai-workspace-common/components/search/cmdk/filter';

import './index.scss';
import { Home } from './home';

// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { SearchDomain, SearchResult, SkillMeta } from '@refly/openapi-schema';
import { RenderItem } from '../../types/item';
import classNames from 'classnames';

// hooks
import { useLoadExtensionWeblinkData } from '../../hooks/use-load-weblink-data.extension';

import { useTranslation } from 'react-i18next';
import { BaseMarkType, frontendBaseMarkTypes, backendBaseMarkTypes, Mark } from '@refly/common-types';
import { getTypeIcon } from '../../utils/icon';
import { SortMark } from '../../types/mark';

import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';

interface CustomProps {
  showList?: boolean;
  onClickOutside?: () => void;
  onSearchValueChange?: (value: string) => void;
  onSelect?: (newMark: Mark) => void;
  onClose?: () => void;
}

export interface BaseSearchAndSelectorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'>,
    CustomProps {
  selectedItems: SortMark[];
}

const mapSearchResultToMark = (searchResult: SearchResult): Mark => {
  const newMark: Mark = {
    id: searchResult.id,
    entityId: searchResult.id,
    type: searchResult.domain,
    data: (searchResult?.snippets?.map((snippet) => snippet.text) || []).join('\n'),
    title: searchResult.title,
  };

  return newMark;
};

export const BaseSearchAndSelector = ({
  onClose,
  onSelect,
  showList,
  onClickOutside,
  onSearchValueChange,
  selectedItems = [],
}: BaseSearchAndSelectorProps) => {
  const [activeTab, setActiveTab] = useState<BaseMarkType | 'all'>('all');
  const [searchValue, setSearchValue] = useState('');
  const [activeValue, setActiveValue] = React.useState('');
  const ref = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [displayMode, setDisplayMode] = useState<'search' | 'list'>('list');
  const [isComposing, setIsComposing] = useState(false);
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);

  // handle extension weblink
  const { loadExtensionWeblinkData } = useLoadExtensionWeblinkData();

  console.log('activeValue', activeValue);

  // stores
  const searchStore = useSearchStore();
  // hooks

  const isHome = activeTab === 'all';
  const isWeb = getRuntime() === 'web';

  const debouncedSearch = useDebouncedCallback(
    async ({ searchVal, domains }: { searchVal: string; domains?: Array<SearchDomain> }) => {
      setLoading(true);

      const { data, error } = await getClient().search({
        body: {
          query: searchVal,
          domains: domains,
        },
      });

      setLoading(false);

      if (error) {
        Message.error(String(error));
        return;
      }

      const resData = data?.data || [];
      let marks = resData.map(mapSearchResultToMark);

      if (!isWeb) {
        const { success, data: extensionWeblinkData } = await loadExtensionWeblinkData();
        if (success) {
          const filteredExtensionWeblinks = extensionWeblinkData.filter((item) =>
            defaultFilter(item.title, searchVal, searchVal.toLowerCase().split(/\s+/)),
          );
          marks = [...marks, ...filteredExtensionWeblinks];
        }
      }

      // notes
      // 将 SearchResult 转换为 Mark

      searchStore.setNoCategoryBigSearchRes(marks);
    },
    200,
  );

  const handleBigSearchValueChange = (searchVal: string, domain: BaseMarkType) => {
    // searchVal 为空的时候获取正常列表的内容
    if (!searchVal) {
      setDisplayMode('list');

      if (backendBaseMarkTypes.includes(domain)) {
        debouncedSearch({
          searchVal: '',
          domains: (domain ? [domain] : undefined) as SearchDomain[],
        });
      } else if (frontendBaseMarkTypes.includes(domain)) {
        // TODO: 兼容 all 和 extensionWeblink 的场景
        if (domain === 'all') {
          debouncedSearch({
            searchVal: '',
            domains: backendBaseMarkTypes as SearchDomain[],
          });
        }
      }
    } else {
      // searchVal 不为空的时候获取搜索的内容
      setDisplayMode('search');

      if (backendBaseMarkTypes.includes(domain)) {
        debouncedSearch({
          searchVal: searchVal,
          domains: (domain ? [domain] : undefined) as SearchDomain[],
        });
      } else if (frontendBaseMarkTypes.includes(domain)) {
        // TODO: 兼容 all 和 extensionWeblink 的场景
        if (domain === 'all') {
          debouncedSearch({
            searchVal,
            domains: backendBaseMarkTypes as SearchDomain[],
          });
        }
      }
    }
  };

  const handleConfirm = (activeValue: string, sortedRenderData: RenderItem[]) => {
    const [_, id] = activeValue.split('__');
    const mark = sortedRenderData.find((item) => item.data.id === id);
    onSelect(mark?.data);
  };

  useEffect(() => {
    inputRef?.current?.focus();

    handleBigSearchValueChange('', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      // Click was outside the component
      if (ref.current && !ref.current.contains(event.target) && onClickOutside) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const sortedMarks: Mark[] = [
    ...((selectedItems || []).map((item) => ({ ...item, isSelected: true })) || []),
    ...(searchStore.noCategoryBigSearchRes?.filter(
      (item) => !selectedItems.some((selected) => selected.id === item.id),
    ) || []),
  ];
  const sortedRenderData: RenderItem[] = sortedMarks.map((item) => ({
    domain: item.domain,
    heading: item.title,
    data: item,
    type: item.type,
    icon: getTypeIcon(item.type, { width: 12, height: 12 }),
    onItemClick: (item: Mark) => {
      onSelect(item);
    },
  }));

  const getInputPlaceholder = (domain: BaseMarkType | 'all') => {
    if (domain === 'all') {
      if (getRuntime() === 'web') {
        return t('knowledgeBase.context.popoverSelector.webPlaceholder');
      } else {
        return t('knowledgeBase.context.popoverSelector.extensionPlaceholder');
      }
    }
  };

  return (
    <Command
      value={activeValue}
      onValueChange={setActiveValue}
      ref={ref}
      filter={(value, search, keywords) => {
        return defaultFilter(value, search, keywords);
      }}
      className={classNames(showList ? 'search-active' : '')}
      onCompositionStart={(e) => console.log('composition start')}
      onCompositionUpdate={(e) => console.log('composition update')}
      onCompositionEnd={(e) => console.log('composition end')}
      onKeyDownCapture={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isComposing) {
          console.log('keydown', searchValue);
        }

        if (isHome || searchValue.length) {
          return;
        }
      }}
    >
      <div cmdk-input-wrapper="">
        <Command.Input
          autoFocus
          ref={inputRef}
          value={searchValue}
          placeholder={getInputPlaceholder(activeTab)}
          onCompositionStart={(e) => {
            setIsComposing(true);
          }}
          onCompositionUpdate={(e) => console.log('composition update')}
          onCompositionEnd={(e) => {
            setIsComposing(false);
          }}
          onValueChange={(val) => {
            if (onSearchValueChange) {
              onSearchValueChange(val);
            }
            setSearchValue(val);
            handleBigSearchValueChange(val, activeTab);
          }}
        />
      </div>
      <Spin
        loading={loading}
        style={{ width: '100%', height: 'calc(100% - 56px)' }}
        className="context-search-list-container"
      >
        <Command.List>
          <Command.Empty>No results found.</Command.Empty>
          <Home
            showItemDetail={false}
            key={'search'}
            displayMode={displayMode}
            data={sortedRenderData}
            activeValue={activeValue}
            setValue={setActiveValue}
            searchValue={searchValue}
          />
        </Command.List>
      </Spin>
      <div cmdk-footer="">
        <div className="cmdk-footer-inner">
          <div className="cmdk-footer-hint">
            <div cmdk-vercel-shortcuts="">
              <span>
                <kbd>↑</kbd>
                <kbd>↓</kbd> {t('knowledgeBase.context.popoverSelector.footer.navigate')}
              </span>
              <span>
                <kbd>↵</kbd> {t('knowledgeBase.context.popoverSelector.footer.toggle')}
              </span>
            </div>
          </div>
          <div className="cmdk-footer-action">
            <Button type="primary" size="mini" onClick={() => onClose?.()}>
              {t('knowledgeBase.context.popoverSelector.footer.done')}
            </Button>
          </div>
        </div>
      </div>
    </Command>
  );
};
