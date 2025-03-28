import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Checkbox } from 'antd';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import React from 'react';
import { SelectedItems } from './index';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Spinner } from '@refly-packages/ai-workspace-common/components/workspace/scroll-loading';
import { EndMessage } from '@refly-packages/ai-workspace-common/components/workspace/scroll-loading';
import { Spin } from '@refly-packages/ai-workspace-common/components/common/spin';

interface DocumentsProps {
  visible: boolean;
  selectedItems: SelectedItems[];
  existingItems: string[];
  onSelectedItemsChange: (selectedItems: SelectedItems[]) => void;
}

const DocumentsMemo = ({
  visible,
  selectedItems,
  onSelectedItemsChange,
  existingItems,
}: DocumentsProps) => {
  const { t } = useTranslation();
  const [checkedValues, setCheckedValues] = useState<string[]>([]);

  const { dataList, loadMore, reload, hasMore, isRequesting, setDataList } = useFetchDataList({
    fetchData: async (queryPayload) => {
      const res = await getClient().listDocuments({
        query: queryPayload,
      });
      return res?.data;
    },
    pageSize: 20,
  });

  const handleItemSelect = useCallback(
    (docIds: string[]) => {
      setCheckedValues(docIds);
      onSelectedItemsChange(docIds.map((docId) => ({ entityType: 'document', entityId: docId })));
    },
    [onSelectedItemsChange],
  );

  const documentItems = useMemo(() => {
    return (
      <Checkbox.Group
        className="w-full flex flex-col gap-2"
        value={checkedValues}
        options={dataList?.map((item) => ({
          label: item.title || t('common.untitled'),
          value: item.docId,
          disabled: existingItems.includes(item.docId),
        }))}
        onChange={(values) => {
          handleItemSelect(values as string[]);
        }}
      >
        {dataList?.map((item) => (
          <Checkbox
            value={item.docId}
            key={item.docId}
            disabled={existingItems.includes(item.docId)}
          >
            {item.title || t('common.untitled')}
          </Checkbox>
        ))}
      </Checkbox.Group>
    );
  }, [dataList, t, handleItemSelect, existingItems, checkedValues]);

  const emptyState = useMemo(() => {
    return <div className="h-full flex items-center justify-center text-gray-500">暂无文档</div>;
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!isRequesting && hasMore) {
      loadMore();
    }
  }, [isRequesting, hasMore, loadMore]);

  useEffect(() => {
    const docIds = selectedItems?.map((item) => item.entityId) || [];
    setCheckedValues(docIds);
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
      <div id="documentsScrollableDiv" className="source-list w-full overflow-y-auto">
        {dataList?.length > 0 ? (
          <InfiniteScroll
            dataLength={dataList.length}
            next={handleLoadMore}
            hasMore={hasMore}
            loader={<Spinner />}
            endMessage={<EndMessage />}
            scrollableTarget="documentsScrollableDiv"
          >
            {documentItems}
          </InfiniteScroll>
        ) : (
          !isRequesting && emptyState
        )}
      </div>
    </Spin>
  );
};

export const Documents = React.memo(DocumentsMemo);
