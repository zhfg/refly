import React, { useState } from 'react';
import { List, Tag, Checkbox, Button, Popover, message, Skeleton } from 'antd';
import { useMultilingualSearchStore, useMultilingualSearchStoreShallow } from '../stores/multilingual-search';
import { useTranslation } from 'react-i18next';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import './search-results.scss';
import { Source } from '@refly/openapi-schema';
import { useImportResourceStore } from '@refly-packages/ai-workspace-common/stores/import-resource';
import { TranslationWrapper } from '@refly-packages/ai-workspace-common/components/translation-wrapper';
import { SearchLocale } from '../stores/multilingual-search';
import { safeParseURL } from '@refly-packages/utils/url';
import { AiOutlineGlobal, AiOutlineTranslation } from 'react-icons/ai';

interface SearchResultsProps {
  className?: string;
  outputLocale: SearchLocale;
  config?: {
    showCheckbox?: boolean; // 是否显示复选框
    startIndex?: number; // 序号起始值
    showIndex?: boolean; // 是否显示序号
    handleItemClick?: (item: Source) => void; // 自定义点击处理
  };
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  className,
  outputLocale,
  config = {
    showCheckbox: true,
    startIndex: 1,
    showIndex: true,
    handleItemClick: (item) => window.open(item.url, '_blank'),
  },
}) => {
  const { t } = useTranslation();
  const { results, selectedItems, toggleSelectedItem, isSearching } = useMultilingualSearchStoreShallow((state) => ({
    results: state.results,
    selectedItems: state.selectedItems,
    toggleSelectedItem: state.toggleSelectedItem,
    isSearching: state.isSearching,
  }));
  const [saveLoading, setSaveLoading] = useState(false);

  const handleSaveItem = async (item: Source) => {
    try {
      setSaveLoading(true);
      const { selectedProjectId } = useImportResourceStore.getState();
      const res = await getClient().batchCreateResource({
        body: [
          {
            resourceType: 'weblink',
            title: item.title,
            data: {
              url: item.url,
              title: item.title,
            },
            projectId: selectedProjectId,
          },
        ],
      });

      if (!res?.data?.success) {
        throw new Error('Save failed');
      }

      message.success(t('common.putSuccess'));
    } catch (err) {
      message.error(t('common.putError'));
    } finally {
      setSaveLoading(false);
    }
  };

  const renderPopoverContent = (item: Source) => (
    <div className="search-result-popover-content">
      <h4>
        <TranslationWrapper
          content={item.title || ''}
          targetLanguage={outputLocale.code}
          originalLocale={item.metadata?.originalLocale}
        />
      </h4>
      <div className="content-body">
        <TranslationWrapper
          content={item.pageContent}
          targetLanguage={outputLocale.code}
          originalLocale={item.metadata?.originalLocale}
        />
      </div>
    </div>
  );

  const renderSkeletonItem = () => (
    <List.Item className="result-item">
      <div className="result-item-inner">
        <div className="result-details w-full">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <Skeleton.Input active className="!w-[400px] !mb-3" />
              <Skeleton paragraph={{ rows: 2 }} active />
            </div>
          </div>
        </div>
      </div>
    </List.Item>
  );

  return (
    <div className={`search-results ${className || ''}`}>
      <div className="search-results-content">
        {isSearching ? (
          <List className="search-results-skeleton-list">
            {[1, 2, 3].map((i) => (
              <React.Fragment key={i}>{renderSkeletonItem()}</React.Fragment>
            ))}
          </List>
        ) : (
          <List
            dataSource={results}
            renderItem={(item, index) => (
              <List.Item className="result-item">
                <div className="result-item-inner">
                  {config.showCheckbox && (
                    <Checkbox
                      checked={selectedItems.includes(item)}
                      onChange={(e) => toggleSelectedItem(item, e.target.checked)}
                    />
                  )}
                  <Popover
                    content={renderPopoverContent(item)}
                    title={null}
                    placement="left"
                    overlayClassName="search-result-popover"
                    trigger="hover"
                    mouseEnterDelay={0.5}
                  >
                    <div className="result-details" onClick={() => config.handleItemClick?.(item)}>
                      {config.showIndex && (
                        <div className="w-5">
                          <span className="h-8 w-8 inline-flex items-center justify-center origin-top-left scale-[60%] transform cursor-pointer rounded-full bg-zinc-100 text-center text-base font-medium no-underline hover:bg-zinc-300">
                            {(config.startIndex || 1) + index}
                          </span>
                        </div>
                      )}
                      <div className="result-body">
                        <div className="result-header">
                          <div className="site-info">
                            <img
                              className="site-icon"
                              src={`https://www.google.com/s2/favicons?domain=${safeParseURL(item.url)}&sz=32`}
                              alt=""
                            />
                            <div className="site-meta">
                              <a className="site-url" href={item.url} target="_blank" rel="noreferrer">
                                {item.url}
                              </a>
                            </div>
                          </div>
                          {item.metadata?.translatedDisplayLocale && (
                            <Tag className="locale-tag">
                              <span>
                                <AiOutlineGlobal /> {item.metadata.originalLocale}
                              </span>{' '}
                              →{' '}
                              <span>
                                <AiOutlineTranslation /> {item.metadata.translatedDisplayLocale}
                              </span>
                            </Tag>
                          )}
                        </div>
                        <div className="result-content">
                          <div className="result-title">
                            <TranslationWrapper
                              className="site-title"
                              content={item.title || ''}
                              targetLanguage={outputLocale.code}
                              originalLocale={item.metadata?.originalLocale}
                            />
                          </div>
                          <div className="result-content">
                            <TranslationWrapper
                              content={item.pageContent}
                              targetLanguage={outputLocale.code}
                              originalLocale={item.metadata?.originalLocale}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Popover>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
};
