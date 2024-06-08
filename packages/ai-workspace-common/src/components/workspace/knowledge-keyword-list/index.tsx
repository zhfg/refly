import { Button, Divider, Radio, Skeleton, Message as message } from '@arco-design/web-react';
import { IconArchive, IconBulb } from '@arco-design/web-react/icon';

import './index.scss';
import { useNavigate } from '@refly-packages/ai-workspace-common/utils/router';
import { useDigestTopicStore } from '@refly-packages/ai-workspace-common/stores/digest-topics';
import { useEffect, useState } from 'react';
// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
// utils
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

export const KnowledgeKeywordList = () => {
  const digestTopicStore = useDigestTopicStore();
  const navigate = useNavigate();
  // 获取内容中
  const [isFetching, setIsFetching] = useState(false);

  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];

  // 只需要获取一页 topics 即可
  const fetchData = async (currentPage = 1) => {
    try {
      // 如果已经有 topics 了，就不再次获取
      setIsFetching(true);
      const { topicList } = useDigestTopicStore.getState();
      if (topicList?.length > 0) return;

      const { data: newRes, error } = await getClient().getUserTopics();

      if (error) {
        throw error;
      }

      console.log('topicsList', newRes);
      digestTopicStore.updateCurrentPage(currentPage);

      if (!newRes?.success) {
        throw new Error(newRes?.errMsg);
      }
      if (newRes?.data && newRes?.data?.list?.length < digestTopicStore.pageSize) {
        digestTopicStore.updateHasMore(false);
      }

      console.log('newRes', newRes);
      digestTopicStore.updateTopicList(newRes?.data?.list);
      digestTopicStore.updateTopicTotalCnt(newRes?.data?.total as number);
      setIsFetching(false);
    } catch (err) {
      message.error('获取主题列表失败，请重新刷新试试');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // TODO: 这里后续国际化的时候还需要改进
  return (
    <div className="knowledge-keyword-list-container">
      <div className="trending-topic-container">
        {isFetching ? (
          <div className={classNames('trending-topics')}>
            {Array(5)
              .fill(null)
              .map((item, index) => (
                <Skeleton
                  key={index}
                  animation
                  text={{
                    rows: 1,
                    width: [100],
                    className: 'custom-skeleton-node',
                  }}
                ></Skeleton>
              ))}
          </div>
        ) : null}
        {!isFetching && digestTopicStore?.topicList?.length > 0 ? (
          <div
            className={classNames('trending-topics', {
              'trending-topics-language-en': language === 'en' ? true : false,
            })}
          >
            {digestTopicStore.topicList?.map((item, index) => (
              <div
                key={index}
                className="trending-topic-item"
                onClick={() => {
                  navigate(`/digest/topic/${item?.id}`);
                }}
              >
                <Button icon={<IconBulb />}>{item?.topic?.name}</Button>
              </div>
            ))}
            {digestTopicStore?.topicList?.length > 0 && (
              <div className="trending-topic-item see-all">
                <Button onClick={() => navigate('/digest/topics')} icon={<IconBulb />}>
                  {t('knowledgeLibrary.header.seeAll')}+{digestTopicStore?.total || 0}
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
