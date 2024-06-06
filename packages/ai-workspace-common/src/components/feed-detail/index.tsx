import { useEffect, useState } from 'react';
import { useParams } from '@refly-packages/ai-workspace-common/utils/router';
import { Message as message } from '@arco-design/web-react';
import { Digest } from '@refly/openapi-schema';
import { useDigestDetailStore } from '@refly-packages/ai-workspace-common/stores/digest-detail';
// utils
import { buildSessionsFromFeed } from '@refly-packages/ai-workspace-common/utils/session';
// 组件
import { DigestDetailContent } from './digest-detail-content';
import { Header } from './header';
import { AskFollowUpModal } from '@refly-packages/ai-workspace-common/components/ask-follow-up-modal/index';
// request
import client from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
// styles
import './digest-detail.scss';

/**
 * 1. same as thread，but only for read
 * 2. if user want to start ask following，then need create a new thread
 *
 */
export const FeedDetail = () => {
  const params = useParams<{ feedId: string }>();
  const [askFollowUpVisible, setAskFollowUpVisible] = useState(false);

  const digestDetailStore = useDigestDetailStore();

  const handleGetDetail = async (feedId: string) => {
    try {
      const { data: newRes, error } = await client.getContentDetail({
        path: {
          cid: feedId,
        },
      });

      if (error) {
        throw error;
      }
      if (!newRes?.success) {
        throw new Error(newRes?.errMsg);
      }

      console.log('newRes', newRes);
      if (newRes.data) {
        digestDetailStore.updateDigest(newRes?.data);
      }
    } catch (err) {
      message.error('获取内容详情失败，请重新刷新试试');
    }
  };

  const handleAskFollowUp = () => {
    setAskFollowUpVisible(true);
  };

  useEffect(() => {
    if (params?.feedId) {
      console.log('params', params);
      handleGetDetail(params?.feedId as string);
    }
  }, []);

  const sessions = buildSessionsFromFeed(digestDetailStore?.digest);

  return (
    <div
      className="digest-detail-container"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header digest={digestDetailStore?.digest} />
      <DigestDetailContent sessions={sessions} handleAskFollowUp={handleAskFollowUp} />

      {askFollowUpVisible ? (
        <AskFollowUpModal
          visible={askFollowUpVisible}
          setVisible={(visible) => setAskFollowUpVisible(visible)}
          aigcContent={digestDetailStore?.digest}
        />
      ) : null}
    </div>
  );
};
