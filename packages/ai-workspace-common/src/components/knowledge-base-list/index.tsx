/**
 * 只聚焦昨天、今天、这周、这个月最核心的内容，剩下的让用户去归档里面查看，能够对自己的工作有一个明确的感知
 */

import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { List, Skeleton, Message as message } from '@arco-design/web-react';
import { IconBook, IconMore } from '@arco-design/web-react/icon';
// types
import { IconTip } from '@refly-packages/ai-workspace-common/components/dashboard/icon-tip';
import { copyToClipboard } from '@refly-packages/ai-workspace-common/utils';
import { getClientOrigin } from '@refly/utils/url';
// components
import { useEffect, useState } from 'react';
import { EmptyDigestStatus } from '@refly-packages/ai-workspace-common/components/empty-digest-today-status';
import { CardBox } from '@refly-packages/ai-workspace-common/components/workspace/card-box';
// utils
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
// styles
import './index.scss';
import { LOCALE } from '@refly/common-types';
import { Collection, Source } from '@refly/openapi-schema';
import { useTranslation } from 'react-i18next';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import classNames from 'classnames';

export const getFirstSourceLink = (sources: Source[]) => {
  return sources?.[0]?.metadata?.source;
};

interface KnowledgeBaseListProps {
  classNames?: string;
  handleItemClick: (kbId: string) => void;
}

export const KnowledgeBaseList = (props: KnowledgeBaseListProps) => {
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const [scrollLoading, setScrollLoading] = useState(<Skeleton animation style={{ width: '100%' }}></Skeleton>);
  const [isFetching, setIsFetching] = useState(false);
  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];

  const fetchData = async (currentPage = 1) => {
    let newData: Collection[] = [];
    let data: Collection[] = [];

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

      if (!knowledgeBaseStore.hasMore && currentPage !== 1) {
        setScrollLoading(<span>{t('knowledgeLibrary.archive.item.noMoreText')}</span>);

        return;
      }

      const newRes = await getClient().listCollections({
        query: {
          // TODO: confirm time filter
          page: currentPage,
          pageSize: knowledgeBaseStore.pageSize,
        },
      });

      if (newRes.error || !newRes?.data?.success) {
        throw new Error(newRes?.data?.errMsg);
      }

      console.log('newRes', newRes);
      data = newRes.data?.data || [];
      newData = currentPage === 1 ? data : knowledgeBaseStore.knowledgeBaseList.concat(data);
      knowledgeBaseStore.updateKnowledgeBaseList(newData);
      knowledgeBaseStore.updateHasMore(!!data.length);
    } catch (err) {
      message.error(t('knowledgeLibrary.archive.list.fetchErr'));
    } finally {
      const { knowledgeBaseList, pageSize } = useKnowledgeBaseStore.getState();

      if (knowledgeBaseList?.length === 0) {
        setScrollLoading(<EmptyDigestStatus />);
      } else if (data.length === 0 || (newData?.length >= 0 && newData?.length < pageSize)) {
        setScrollLoading(<span>{t('knowledgeLibrary.archive.item.noMoreText')}</span>);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className={classNames('today-container', 'knowledge-base-list-container', props.classNames)}>
      <div className="today-feature-container">
        
        <List
          grid={{
            sm: 24,
            md: 12,
            lg: 8,
            xl: 6,
          }}
          className="digest-list knowledge-base-list workspace-list"
          wrapperStyle={{ width: '100%' }}
          bordered={false}
          pagination={false}
          offsetBottom={200}
          dataSource={knowledgeBaseStore.knowledgeBaseList || []}
          scrollLoading={scrollLoading}
          onReachBottom={(currentPage) => fetchData(currentPage)}
          render={(item: Collection, key) => (
            <List.Item
              key={item?.collectionId + key}
              style={{
                padding: '20px 0',
              }}
              className="knowledge-base-list-item-container"
              actionLayout="vertical"
              onClick={() => {
                props.handleItemClick(item?.collectionId);
              }}
              actions={[
                <CardBox cardData={item} type="knowledge" cardIcon={<IconBook style={{ fontSize: '32px', strokeWidth: 3}} />} onClick={() => {props.handleItemClick(item?.collectionId);}}>
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-xs text-black/40">
                      {time(item.updatedAt, language as LOCALE)
                        .utc()
                        .fromNow()}
                    </div>
                    <div className="flex items-center">
                      {/* TODO: 添加事件 */}
                      <IconBook style={{ color: '#819292', cursor: 'pointer' }} />
                      <IconTip text={t('knowledgeLibrary.archive.item.copy')}>
                        <span
                          key={1}
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(`${getClientOrigin()}/knowledge-base?kbId=${item?.collectionId}`);
                            message.success(t('knowledgeLibrary.archive.item.copyNotify'));
                          }}
                        >
                         <IconMore style={{ color: '#819292', marginLeft: '12px', cursor: 'pointer' }} />
                        </span>
                      </IconTip>
                    </div>
                  </div>
                </CardBox>
              ]}
            >
            </List.Item>
          )}
        />
      </div>
    </div>
  );
};
