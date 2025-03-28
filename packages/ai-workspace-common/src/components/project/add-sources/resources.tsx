import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';
import { useCallback, useMemo, useEffect, useState } from 'react';
import { Checkbox } from 'antd';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import React from 'react';
import { SelectedItems } from './index';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Spinner } from '@refly-packages/ai-workspace-common/components/workspace/scroll-loading';
import { EndMessage } from '@refly-packages/ai-workspace-common/components/workspace/scroll-loading';
import { Spin } from '@refly-packages/ai-workspace-common/components/common/spin';

interface ResourcesProps {
  visible: boolean;
  selectedItems: SelectedItems[];
  existingItems: string[];
  onSelectedItemsChange: (selectedItems: SelectedItems[]) => void;
}

const ResourcesMemo = ({
  visible,
  selectedItems,
  onSelectedItemsChange,
  existingItems,
}: ResourcesProps) => {
  const { t } = useTranslation();
  const [checkedValues, setCheckedValues] = useState<string[]>([]);

  const { dataList, loadMore, reload, hasMore, isRequesting, setDataList } = useFetchDataList({
    fetchData: async (queryPayload) => {
      const res = await getClient().listResources({
        query: queryPayload,
      });
      return res?.data;
    },
    pageSize: 20,
  });

  const handleItemSelect = useCallback(
    (resourceIds: string[]) => {
      setCheckedValues(resourceIds);
      onSelectedItemsChange(
        resourceIds.map((resourceId) => ({ entityType: 'resource', entityId: resourceId })),
      );
    },
    [onSelectedItemsChange],
  );

  const resourceItems = useMemo(() => {
    return (
      <Checkbox.Group
        className="w-full flex flex-col gap-2"
        value={checkedValues}
        options={dataList?.map((item) => ({
          label: item.title || t('common.untitled'),
          value: item.resourceId,
          disabled: existingItems.includes(item.resourceId),
        }))}
        onChange={(values) => {
          handleItemSelect(values as string[]);
        }}
      >
        {dataList?.map((item) => (
          <Checkbox
            value={item.resourceId}
            key={item.resourceId}
            disabled={existingItems.includes(item.resourceId)}
          >
            {item.title || t('common.untitled')}
          </Checkbox>
        ))}
      </Checkbox.Group>
    );
  }, [dataList, t, existingItems, handleItemSelect, checkedValues]);

  const emptyState = useMemo(() => {
    return <div className="h-full flex items-center justify-center text-gray-500">暂无资源</div>;
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!isRequesting && hasMore) {
      loadMore();
    }
  }, [isRequesting, hasMore, loadMore]);

  useEffect(() => {
    const resourceIds = selectedItems?.map((item) => item.entityId) || [];
    setCheckedValues(resourceIds);
  }, [selectedItems]);

  useEffect(() => {
    if (visible) {
      reload();
    } else {
      setCheckedValues([]);
      setDataList([]);
    }
  }, [visible]);

  return (
    <Spin className="w-full h-full" spinning={isRequesting && dataList?.length === 0}>
      <div id="resourcesScrollableDiv" className="source-list w-full overflow-y-auto">
        {dataList?.length > 0 ? (
          <InfiniteScroll
            dataLength={dataList.length}
            next={handleLoadMore}
            hasMore={hasMore}
            loader={<Spinner />}
            endMessage={<EndMessage />}
            scrollableTarget="resourcesScrollableDiv"
          >
            {resourceItems}
          </InfiniteScroll>
        ) : (
          !isRequesting && emptyState
        )}
      </div>
    </Spin>
  );
};

export const Resources = React.memo(ResourcesMemo);
