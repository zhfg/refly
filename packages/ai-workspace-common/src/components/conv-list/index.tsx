import React, { useEffect, useState } from 'react';

// 组件
import { List, Skeleton, Message as message, Typography } from '@arco-design/web-react';
// stores
import { useThreadStore } from '@refly-packages/ai-workspace-common/stores/thread';
import { HiOutlineClock } from 'react-icons/hi2';
import { LuChevronRightCircle } from 'react-icons/lu';
import { BiMessageRoundedDetail } from 'react-icons/bi';
import { useNavigate } from '@refly-packages/ai-workspace-common/utils/router';
// utils
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
// types
import { LOCALE } from '@refly/common-types';
import { Conversation } from '@refly/openapi-schema';
import './index.scss';
// components
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';

interface ConvListProps {
  classNames: string;
  handleConvItemClick: (convId: string, projectId?: string) => void;
}

export const ConvList = (props: ConvListProps) => {
  const [scrollLoading, setScrollLoading] = useState(<Skeleton animation></Skeleton>);
  const threadStore = useThreadStore();
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];

  const fetchData = async (currentPage = 1) => {
    try {
      console.log('currentPage', currentPage);
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

      if (!threadStore?.hasMore && currentPage !== 1) {
        setScrollLoading(<span>{t('threadLibrary.footer.noMoreText')}</span>);
        return;
      }

      const { error, data: newRes } = await getClient().listConversations({
        query: {
          page: currentPage,
          pageSize: 10,
        },
      });
      if (error) {
        throw error;
      }

      threadStore.updateCurrentPage(currentPage);

      if (!newRes?.success) {
        throw new Error(newRes?.errMsg);
      }
      if (newRes?.data && newRes?.data?.length < threadStore?.pageSize) {
        threadStore.updateHasMore(false);
      }

      console.log('newRes', newRes);
      threadStore.updateThreadList(newRes?.data || []);
    } catch (err) {
      message.error(t('threadLibrary.list.fetchErr'));
    } finally {
      const { threads, pageSize } = useThreadStore.getState();

      if (threads?.length === 0) {
        setScrollLoading(<div>暂无内容...</div>);
      } else if (threads?.length > 0 && threads?.length < pageSize) {
        setScrollLoading(<span>{t('threadLibrary.footer.noMoreText')}~</span>);
      }
    }
  };

  useEffect(() => {
    fetchData();

    return () => {
      threadStore.resetState();
    };
  }, []);

  console.log('props.classNames', props.classNames);

  return (
    <List
      className={classNames('thread-library-list', props.classNames)}
      wrapperStyle={{ width: '100%' }}
      bordered={false}
      pagination={false}
      offsetBottom={50}
      dataSource={threadStore?.threads}
      scrollLoading={scrollLoading}
      onReachBottom={(currentPage) => fetchData(currentPage)}
      noDataElement={<div>{t('threadLibrary.footer.noMoreText')}</div>}
      render={(item: Conversation, index) => (
        <List.Item
          key={index}
          style={{
            padding: '20px 0',
            borderBottom: '1px solid var(--color-fill-3)',
          }}
          className="thread-library-list-item"
          actionLayout="vertical"
          onClick={() => {
            props.handleConvItemClick(item?.convId, item?.projectId);
          }}
          actions={[
            <span key={2} className="flex items-center conv-action-list-item">
              <HiOutlineClock style={{ fontSize: 14, color: '#64645F' }} />
              <span className="thread-library-list-item-text">
                {time(item.updatedAt, language as LOCALE)
                  .utc()
                  .fromNow()}
              </span>
            </span>,
            <span key={3} className="flex items-center conv-action-list-item">
              <BiMessageRoundedDetail style={{ fontSize: 14, color: '#64645F' }} />
              <span className="thread-library-list-item-text">{item?.messageCount}</span>
            </span>,
          ]}
        >
          <List.Item.Meta
            title={item.title}
            description={
              <Typography.Paragraph
                ellipsis={{ rows: 2, wrapper: 'span' }}
                style={{ color: 'rgba(0, 0, 0, .4) !important' }}
              >
                {item.lastMessage}
              </Typography.Paragraph>
            }
          />
        </List.Item>
      )}
    />
  );
};
