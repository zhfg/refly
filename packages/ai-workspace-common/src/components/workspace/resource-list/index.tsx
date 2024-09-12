import { useEffect } from 'react';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { useTranslation } from 'react-i18next';

import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { List, Empty, Divider, Tooltip } from '@arco-design/web-react';
import { IconLoading } from '@arco-design/web-react/icon';

import { Resource } from '@refly/openapi-schema';

import { CardBox } from '../card-box';
import { DeleteDropdownMenu } from '@refly-packages/ai-workspace-common/components/knowledge-base/delete-dropdown-menu';

import { ScrollLoading } from '../scroll-loading';
import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';

import { useReloadListState } from '@refly-packages/ai-workspace-common/stores/reload-list-state';

import { LOCALE } from '@refly/common-types';
import './index.scss';

export const ResourceList = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];

  const reloadListState = useReloadListState();

  const { dataList, loadMore, hasMore, isRequesting, reload, setDataList } = useFetchDataList({
    fetchData: async (queryPayload) => {
      const res = await getClient().listResources({
        query: queryPayload,
      });
      return res?.data;
    },
    pageSize: 12,
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

  useEffect(() => {
    loadMore();
  }, []);

  useEffect(() => {
    if (reloadListState.reloadResourceList) {
      reload();
      reloadListState.setReloadResourceList(false);
    }
  }, [reloadListState.reloadResourceList]);

  const { jumpToReadResource } = useKnowledgeBaseJumpNewPath();

  if (dataList.length === 0 && !isRequesting) {
    return <Empty />;
  }

  const cardIcon = (item: Resource) => {
    return (
      <img src={`https://www.google.com/s2/favicons?domain=${item?.data?.url}&sz=${32}`} alt={item?.data?.title} />
    );
  };

  const IndexStatus = (props: { status: string; resourceId: string; icon?: React.ReactNode }) => {
    const { status, resourceId, icon } = props;
    return (
      <>
        <Divider style={{ margin: '0 4px' }} type="vertical" />
        <Tooltip mini content={t(`resource.${status}_tip`)} style={status === 'index_failed' ? {} : { width: 200 }}>
          <div
            className={status}
            onClick={(e) => {
              e.stopPropagation();
              if (status === 'index_failed') {
                reLoadResource(resourceId);
              }
            }}
          >
            {icon}
            {t(`resource.${status}`)}
          </div>
        </Tooltip>
      </>
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
      loading={isRequesting}
      render={(item: Resource, key) => (
        <List.Item
          key={item?.resourceId + key}
          style={{
            padding: '0',
            width: '100%',
          }}
          actionLayout="vertical"
          onClick={() => {
            jumpToReadResource({ resId: item?.resourceId });
          }}
          actions={[
            <CardBox
              index={key}
              key={item.resourceId}
              cardData={item}
              cardIcon={cardIcon(item)}
              type="resource"
              onClick={() => {
                jumpToReadResource({ resId: item?.resourceId });
              }}
              reLoadResource={() => reLoadResource(item.resourceId)}
            >
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center text-xs text-black/40">
                  <div className="text-xs text-black/40">
                    {time(item.updatedAt, language as LOCALE)
                      .utc()
                      .fromNow()}
                  </div>
                  {item.indexStatus === 'wait_index' && (
                    <IndexStatus
                      resourceId={item.resourceId}
                      status="wait_index"
                      icon={<IconLoading style={{ marginRight: 4 }} />}
                    />
                  )}

                  {item.indexStatus === 'index_failed' && (
                    <IndexStatus resourceId={item.resourceId} status="index_failed" />
                  )}
                </div>
                <div>
                  <DeleteDropdownMenu
                    data={item}
                    type="resource"
                    postDeleteList={(resource: Resource) =>
                      setDataList(dataList.filter((n) => n.resourceId !== resource.resourceId))
                    }
                    getPopupContainer={() => document.getElementById(`resource-${key}`) as HTMLElement}
                  />
                </div>
              </div>
            </CardBox>,
          ]}
        ></List.Item>
      )}
    />
  );
};
