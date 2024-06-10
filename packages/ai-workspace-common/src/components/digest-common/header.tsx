import { useDigestStore } from '@refly-packages/ai-workspace-common/stores/digest';
import { Button, Divider, Radio, Skeleton, Message as message } from '@arco-design/web-react';
import { IconArchive, IconBulb } from '@arco-design/web-react/icon';

import './header.scss';
import { useNavigate } from '@refly-packages/ai-workspace-common/utils/router';
import { getCurrentDateInfo } from '@refly-packages/ai-workspace-common/utils/time';
import { useDigestTopicStore } from '@refly-packages/ai-workspace-common/stores/digest-topics';
import { useEffect, useState } from 'react';
// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
// utils
import { delay } from '@refly-packages/ai-workspace-common/utils/delay';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

interface DigestHeaderProps {
  tab: 'today' | 'archive';
}

export const DigestHeader = (props: DigestHeaderProps) => {
  const digestTopicStore = useDigestTopicStore();
  const navigate = useNavigate();
  // 获取内容中
  const [isFetching, setIsFetching] = useState(false);

  console.log('now tab', props.tab);
  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];

  const handleNavigateArchive = (item: '归档' | '时间线') => {
    const { year, month, day } = getCurrentDateInfo();

    if (item === '归档') {
      navigate(`/`);
    } else if (item === '时间线') {
      navigate(`/?type=timeline&dateType=daily&y=${year}&m=${month}&d=${day}`);
    }
  };

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
    <div className="today-header-container">
      <div className="today-menu" style={{ minWidth: language === 'en' ? '240px' : '210px' }}>
        <Radio.Group defaultValue={props.tab === 'today' ? '归档' : '时间线'}>
          {['归档', '时间线'].map((item) => {
            return (
              <Radio key={item} value={item}>
                {({ checked }) => {
                  return (
                    <Button
                      type="outline"
                      onClick={() => handleNavigateArchive(item as '归档' | '时间线')}
                      icon={item === '归档' ? <IconBulb /> : <IconArchive />}
                      className={`today-menu-item ${checked ? 'today-menu-item-checked' : ''}`}
                    >
                      {item === '归档' ? t('knowledgeLibrary.header.archive') : t('knowledgeLibrary.header.timeline')}
                    </Button>
                  );
                }}
              </Radio>
            );
          })}
        </Radio.Group>
      </div>
      <Divider type="vertical" />
      <div className="trending-topic-container">
        <div className="trending-topic-title" style={{ minWidth: language === 'en' ? '110px' : '70px' }}>
          {t('knowledgeLibrary.header.trendingTopic')}
        </div>
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
                <Button>{item?.topic?.name}</Button>
              </div>
            ))}
            {digestTopicStore?.topicList?.length > 0 && (
              <div className="trending-topic-item see-all">
                <Button onClick={() => navigate('/digest/topics')}>
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
