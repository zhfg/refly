import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { List, Message as message, Empty } from '@arco-design/web-react';
import { IconBook, IconMore } from '@arco-design/web-react/icon';
// types
import { IconTip } from '@refly-packages/ai-workspace-common/components/dashboard/icon-tip';
import { copyToClipboard } from '@refly-packages/ai-workspace-common/utils';
import { getClientOrigin } from '@refly/utils/url';
// components
import { useEffect } from 'react';
import { CardBox } from '@refly-packages/ai-workspace-common/components/workspace/card-box';
import { ScrollLoading } from '@refly-packages/ai-workspace-common/components/workspace/scroll-loading';
// utils
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
// styles
import './index.scss';
import { LOCALE } from '@refly/common-types';
import { Collection, Source } from '@refly/openapi-schema';
import { useTranslation } from 'react-i18next';

import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';

export const getFirstSourceLink = (sources: Source[]) => {
  return sources?.[0]?.metadata?.source;
};

export const KnowledgeBaseList = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];

  const { dataList, loadMore, hasMore, isRequesting } = useFetchDataList({
    fetchData: async (queryPayload) => {
      const res = await getClient().listCollections({
        query: queryPayload,
      });
      return res?.data;
    },
    pageSize: 12,
  });

  useEffect(() => {
    loadMore();
  }, []);

  const { jumpToKnowledgeBase } = useKnowledgeBaseJumpNewPath();

  if (dataList.length === 0) {
    return <Empty />;
  }

  return (
    <List
      grid={{
        sm: 24,
        md: 12,
        lg: 8,
        xl: 6,
      }}
      className="knowledge-base-list workspace-list"
      wrapperStyle={{ width: '100%' }}
      bordered={false}
      pagination={false}
      offsetBottom={200}
      dataSource={dataList}
      scrollLoading={<ScrollLoading isRequesting={isRequesting} hasMore={hasMore} loadMore={loadMore} />}
      render={(item: Collection, key) => (
        <List.Item
          key={item?.collectionId + key}
          style={{
            padding: '20px 0',
          }}
          className="knowledge-base-list-item-container"
          actionLayout="vertical"
          onClick={() => {
            jumpToKnowledgeBase({ kbId: item?.collectionId });
          }}
          actions={[
            <CardBox
              cardData={item}
              type="knowledge"
              cardIcon={<IconBook style={{ fontSize: '32px', strokeWidth: 3 }} />}
              onClick={() => {
                jumpToKnowledgeBase({ kbId: item?.collectionId });
              }}
            >
              <div className="flex items-center justify-between mt-6">
                <div className="text-xs text-black/40">
                  {time(item.updatedAt, language as LOCALE)
                    .utc()
                    .fromNow()}
                </div>
                <div className="flex items-center">
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
            </CardBox>,
          ]}
        ></List.Item>
      )}
    />
  );
};
