import { useEffect, useState } from 'react';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { useTranslation } from 'react-i18next';

import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { List, Skeleton, Message as message } from '@arco-design/web-react';

import { Resource } from '@refly/openapi-schema';
import { IconMore, IconBook } from '@arco-design/web-react/icon';
import { CardBox } from '../card-box';

import { EmptyDigestStatus } from '@refly-packages/ai-workspace-common/components/empty-digest-today-status';

import { LOCALE } from '@refly/common-types';
import './index.scss';

interface ResourceBaseProps {
  handleItemClick: (kbId: string, resId: string) => void;
}

export const ResourceBase = (props: ResourceBaseProps) => {
  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];
  const [resourceList, setResourceList] = useState<Resource[]>([]);
  const [queryParam, setQueryParam] = useState({
    pageSize: 10,
    page: 1,
    hasMore: true,
  });

  const [scrollLoading, setScrollLoading] = useState(<Skeleton animation style={{ width: '100%' }}></Skeleton>);

  const fetchData = async (currentPage = 1) => {
    console.log('currentPage', currentPage, queryParam);
    let listData: Resource[] = [];
    let newListData: Resource[] = [];
    try {
      setScrollLoading(
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
          }}
        >
          <Skeleton animation style={{ width: '100%' }}></Skeleton>
          <Skeleton animation style={{ width: '100%', marginTop: 24 }}></Skeleton>
        </div>,
      );

      if (!queryParam.hasMore && currentPage !== 1) {
        setScrollLoading(<span>{t('knowledgeLibrary.archive.item.noMoreText')}</span>);
        return;
      }

      const res = await getClient().listResources({
        query: {
          resourceType: 'weblink',
          ...queryParam,
          page: currentPage,
        },
      });

      listData = res?.data?.data || [];
      newListData = [...resourceList, ...listData];
      setResourceList(newListData);
      setQueryParam({
        page: currentPage,
        hasMore: !!listData.length,
        pageSize: queryParam.pageSize,
      });
    } catch (err) {
      message.error(t('knowledgeLibrary.archive.list.fetchErr'));
    } finally {
      if (newListData?.length === 0) {
        setScrollLoading(<EmptyDigestStatus />);
      } else if (listData.length < queryParam.pageSize) {
        setScrollLoading(<span>{t('knowledgeLibrary.archive.item.noMoreText')}</span>);
      }
    }
  };

  const cardIcon = (item: Resource) => {
    return (
      <img src={`https://www.google.com/s2/favicons?domain=${item?.data?.url}&sz=${32}`} alt={item?.data?.title} />
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <List
        grid={{
          sm: 24,
          md: 12,
          lg: 8,
          xl: 6,
        }}
        className="resource-base"
        wrapperStyle={{ width: '100%' }}
        bordered={false}
        pagination={false}
        offsetBottom={200}
        dataSource={resourceList || []}
        scrollLoading={scrollLoading}
        onReachBottom={(currentPage) => fetchData(currentPage)}
        render={(item: Resource, key) => (
          <List.Item
            key={item?.resourceId + key}
            style={{
              padding: '0',
              width: '100%',
            }}
            actionLayout="vertical"
            onClick={() => {
              props.handleItemClick(item?.collectionId, item?.resourceId);
            }}
            actions={[
              <CardBox
                key={item.resourceId}
                cardData={item}
                cardIcon={cardIcon(item)}
                type="resource"
                onClick={() => {
                  props.handleItemClick(item?.collectionId, item?.resourceId);
                }}
              >
                <div className="flex items-center justify-between mt-6">
                  <div className="text-xs text-black/40">
                    {time(item.updatedAt, language as LOCALE)
                      .utc()
                      .fromNow()}
                  </div>
                  <div>
                    <IconBook style={{ color: '#819292', cursor: 'pointer' }} />
                    <IconMore style={{ color: '#819292', marginLeft: '12px', cursor: 'pointer' }} />
                  </div>
                </div>
              </CardBox>,
            ]}
          ></List.Item>
        )}
      />
    </>
  );
};
