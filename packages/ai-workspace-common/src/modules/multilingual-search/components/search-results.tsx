import React, { useState } from 'react';
import { List, Tag, Checkbox, Button, Popover, message } from 'antd';
import { useMultilingualSearchStore } from '../stores/multilingual-search';
import { useTranslation } from 'react-i18next';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import './search-results.scss';
import { Source } from '@refly/openapi-schema';
import { useImportResourceStore } from '@refly-packages/ai-workspace-common/stores/import-resource';
import { TranslationWrapper } from '@refly-packages/ai-workspace-common/components/translation-wrapper';

export const SearchResults: React.FC<{ className?: string }> = ({ className }) => {
  const { t } = useTranslation();
  const { results, selectedItems, toggleSelectedItem } = useMultilingualSearchStore();
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
          targetLanguage={useMultilingualSearchStore.getState().outputLocale.code}
          originalLocale={item.metadata?.originalLocale}
        />
      </h4>
      <div className="content-body">
        <TranslationWrapper
          content={item.pageContent}
          targetLanguage={useMultilingualSearchStore.getState().outputLocale.code}
          originalLocale={item.metadata?.originalLocale}
        />
      </div>
    </div>
  );

  return (
    <div className={`search-results ${className || ''}`}>
      <div className="search-results-content">
        <List
          itemLayout="vertical"
          size="large"
          pagination={{ pageSize: 10 }}
          dataSource={results}
          renderItem={(item) => (
            <List.Item>
              <div className="result-item">
                <Checkbox
                  checked={selectedItems.includes(item)}
                  onChange={(e) => toggleSelectedItem(item, e.target.checked)}
                />
                <Popover
                  content={renderPopoverContent(item)}
                  title={null}
                  placement="left"
                  overlayClassName="search-result-popover"
                  trigger="hover"
                  mouseEnterDelay={0.5}
                >
                  <div
                    className="result-details"
                    onClick={(e) => {
                      window.open(item.url, '_blank');
                    }}
                  >
                    <List.Item.Meta
                      title={
                        <TranslationWrapper
                          content={item.title || ''}
                          targetLanguage={useMultilingualSearchStore.getState().outputLocale.code}
                          originalLocale={item.metadata?.originalLocale}
                        />
                      }
                      description={item.url}
                    />
                    {item.metadata?.translatedDisplayLocale && (
                      <Tag color="blue">
                        {item.metadata.originalLocale} → {item.metadata.translatedDisplayLocale}
                      </Tag>
                    )}
                  </div>
                </Popover>
              </div>
            </List.Item>
          )}
        />
      </div>
    </div>
  );
};
