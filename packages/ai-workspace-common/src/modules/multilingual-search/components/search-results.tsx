import React from 'react';
import { List, Tag } from 'antd';
import { useMultilingualSearchStore } from '../stores/multilingual-search';
import './search-results.scss';
import { Source } from '@refly/openapi-schema';

export const SearchResults: React.FC = () => {
  const { results } = useMultilingualSearchStore();

  return (
    <div className="search-results">
      <List
        itemLayout="vertical"
        size="large"
        pagination={{ pageSize: 10 }}
        dataSource={results}
        renderItem={(item: Source) => (
          <List.Item
            extra={
              <Tag color="blue">
                {item.metadata.originalLocale} → {item.metadata.translatedDisplayLocale}
              </Tag>
            }
          >
            <List.Item.Meta title={<a href={item.url}>{item.title}</a>} description={item.url} />
            {item.pageContent}
          </List.Item>
        )}
      />
    </div>
  );
};
