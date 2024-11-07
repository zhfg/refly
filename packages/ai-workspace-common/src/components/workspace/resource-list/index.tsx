import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { List, Empty } from '@arco-design/web-react';

import { Resource } from '@refly/openapi-schema';

import { ResourceCard } from '@refly-packages/ai-workspace-common/components/workspace/resource-list/resource-card';

import { ScrollLoading } from '../scroll-loading';
import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';
import { useJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';

import { useReloadListState } from '@refly-packages/ai-workspace-common/stores/reload-list-state';

import './index.scss';

export const ResourceList = () => {
  const { t } = useTranslation();

  const reloadListState = useReloadListState();

  const { dataList, loadMore, hasMore, isRequesting, reload, setDataList } = useFetchDataList({
    fetchData: async (queryPayload) => {
      const res = await getClient().listResources({
        query: queryPayload,
      });
      return res?.data;
    },
    pageSize: 20,
  });

  const reLoadResource = async (resourceId: string) => {
    const { data } = await getClient().listResources({
      query: {
        resourceId: resourceId,
        pageSize: 1,
        pageNumber: 1,
      },
    });
    if (data.data?.length) {
      const resource = data.data[0];
      setDataList(dataList.map((n) => (n.resourceId === resource.resourceId ? resource : n)));
    }
  };

  const handleReindexResource = async (resourceId: string) => {
    const { data, error } = await getClient().reindexResource({
      body: {
        resourceIds: [resourceId],
      },
    });
    if (error) {
      return;
    }
    if (data.data?.length) {
      const resource = data.data[0];
      setDataList(dataList.map((n) => (n.resourceId === resource.resourceId ? resource : n)));
    }
  };

  useEffect(() => {
    loadMore();
  }, []);

  useEffect(() => {
    if (reloadListState.reloadResourceList) {
      reload();
      reloadListState.setReloadResourceList(false);
    }
  }, [reloadListState.reloadResourceList]);

  const { jumpToResource } = useJumpNewPath();

  if (dataList.length === 0 && !isRequesting) {
    return <Empty />;
  }

  const cardIcon = (item: Resource) => {
    return (
      <img src={`https://www.google.com/s2/favicons?domain=${item?.data?.url}&sz=${32}`} alt={item?.data?.title} />
    );
  };

  return (
    <List
      grid={{
        sm: 24,
        md: 12,
        lg: 8,
        xl: 6,
      }}
      className="resource-list"
      wrapperStyle={{ width: '100%' }}
      bordered={false}
      pagination={false}
      dataSource={dataList}
      scrollLoading={<ScrollLoading isRequesting={isRequesting} hasMore={hasMore} loadMore={loadMore} />}
      render={(item: Resource, key) => (
        <List.Item
          key={item?.resourceId + key}
          style={{
            padding: '0',
            width: '100%',
          }}
          actionLayout="vertical"
          actions={[
            <ResourceCard
              index={key}
              key={item.resourceId}
              cardData={item}
              cardIcon={cardIcon(item)}
              onClick={() => {
                if (['wait_parse', 'parse_failed'].includes(item.indexStatus)) {
                  return;
                } else {
                  jumpToResource({ resId: item?.resourceId });
                }
              }}
              deleteData={(resource: Resource) =>
                setDataList(dataList.filter((n) => n.resourceId !== resource.resourceId))
              }
              reLoadResource={() => reLoadResource(item.resourceId)}
              handleReindexResource={() => {
                return handleReindexResource(item.resourceId);
              }}
            />,
          ]}
        ></List.Item>
      )}
    />
  );
};
