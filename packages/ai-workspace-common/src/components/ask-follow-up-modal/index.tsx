import { Message as message, Modal } from '@arco-design/web-react';
import { useState } from 'react';
// components
// styles
import './index.scss';
// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { Digest, Feed, Conversation as Thread } from '@refly/openapi-schema';
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useConversationStore } from '@refly-packages/ai-workspace-common/stores/conversation';
import { useResetState } from '@refly-packages/ai-workspace-common/hooks/use-reset-state';
import { useNavigate } from '@refly-packages/ai-workspace-common/utils/router';
import { delay } from '@refly-packages/ai-workspace-common/utils/delay';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';

interface SummaryModalProps {
  aigcContent: Digest | Feed;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

/**
 *
 * 用于为 Feed & Digest 的 Source 提供弹框总结能力
 */
export const AskFollowUpModal = (props: SummaryModalProps) => {
  const { aigcContent } = props;
  const [isFetching, setIsFetching] = useState(false);
  const chatStore = useChatStore();
  const conversationStore = useConversationStore();
  const navigate = useNavigate();

  const { t } = useTranslation();
  const { resetState } = useResetState();

  const handleDigestAskFollow = async () => {
    try {
      setIsFetching(true);
      const { newQAText } = useChatStore.getState();
      const { localSettings } = useUserStore.getState();
      console.log('newQAText', newQAText);
      const question = newQAText;

      // TODO: origin/originPageUrl 需要确定
      const newConversationPayload = {
        origin: location?.origin || '', // 冗余存储策略，for 后续能够基于 origin 进行归类归档
        originPageTitle: aigcContent?.title || '',
        title: aigcContent?.title || '',
        originPageUrl: location.href,
      };

      // 创建新会话
      const { data: res, error } = await getClient().createConversation({
        body: {
          ...newConversationPayload,
          cid: aigcContent?.cid,
          locale: localSettings?.outputLocale,
        },
      });

      if (error || !res?.success) {
        console.error(error || res);
        throw new Error(`${error}` || res?.errMsg);
      }

      console.log('createNewConversation', res);
      conversationStore.setCurrentConversation(res?.data as Thread);

      resetState();

      // 更新新的 newQAText，for 新会话跳转使用
      chatStore.setNewQAText(question);
      conversationStore.setIsAskFollowUpNewConversation(true);

      message.success({
        content: t('contentDetail.item.askFollow.successNotify'),
        duration: 2000,
      });
      await delay(2000);
      navigate(`/thread/${res?.data?.convId}`);
    } catch (err) {
      message.error(t('contentDetail.item.askFollow.errorNotify'));
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <Modal
      visible={props.visible}
      title={t('contentDetail.item.askFollow.modal.title')}
      okText={t('contentDetail.item.askFollow.modal.okText')}
      cancelText={t('contentDetail.item.askFollow.modal.cancelText')}
      okButtonProps={{ loading: isFetching }}
      onOk={() => handleDigestAskFollow()}
      onCancel={() => props.setVisible(false)}
    >
      <div className="ask-follow-up-content">
        {t('contentDetail.item.askFollow.modal.content', {
          question: chatStore.newQAText,
        })}
      </div>
    </Modal>
  );
};
