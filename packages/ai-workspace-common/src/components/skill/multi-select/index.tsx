import { useState, useEffect } from 'react';

// components
import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';
// store
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { Select, Button } from '@arco-design/web-react';
const Option = Select.Option;

const config = {
  resource: {
    method: 'listResources',
    display: 'title',
    key: 'resourceId',
  },
  note: {
    method: 'listNotes',
    display: 'title',
    key: 'noteId',
  },
  collection: {
    method: 'listCollections',
    display: 'title',
    key: 'collectionId',
  },
};

type OptionType = 'resource' | 'note' | 'collection';
interface MultiSelectProps {
  type: OptionType;
  placeholder?: string;
  onValueChange: (value: string[]) => void;
}
export const MultiSelect = (props: MultiSelectProps) => {
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
      size="large"
      mode="multiple"
      allowCreate
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
                加载更多
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
