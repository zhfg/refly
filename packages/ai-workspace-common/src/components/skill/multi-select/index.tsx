import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// components
import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';
// store
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { Select, Button } from '@arco-design/web-react';

const Option = Select.Option;

const config = {
  resourceIds: {
    method: 'listResources',
    display: 'title',
    key: 'resourceId',
  },
  noteIds: {
    method: 'listNotes',
    display: 'title',
    key: 'noteId',
  },
  collectionIds: {
    method: 'listCollections',
    display: 'title',
    key: 'collectionId',
  },
};

interface MultiSelectProps {
  type: keyof typeof config;
  placeholder?: string;
  onValueChange: (value: string[]) => void;
}

export const MultiSelect = (props: MultiSelectProps) => {
  const { t } = useTranslation();
  const { placeholder, type, onValueChange } = props;

  const { dataList, loadMore, setDataList, hasMore, isRequesting } = useFetchDataList({
    fetchData: async (queryPayload) => {
      const res = await getClient()[config[type].method]({
        query: queryPayload,
      });
      return res?.data;
    },
    pageSize: 10,
  });

  useEffect(() => {
    loadMore();
  }, []);

  return (
    <Select
      allowClear
      size="large"
      mode="multiple"
      placeholder={placeholder}
      onChange={(value) => {
        onValueChange(value);
      }}
      dropdownRender={(menu) => (
        <div>
          {menu}
          {hasMore ? (
            <div className="search-load-more">
              <Button type="text" loading={isRequesting} onClick={() => loadMore()}>
                {t('common.loadMore')}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    >
      {dataList?.map((item) => (
        <Option key={item[config[type].key]} value={item[config[type].key]}>
          {item[config[type].display]}
        </Option>
      ))}
    </Select>
  );
};
