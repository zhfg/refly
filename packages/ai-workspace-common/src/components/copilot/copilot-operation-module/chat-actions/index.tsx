import { Button, Dropdown, Menu, FormInstance, Checkbox } from '@arco-design/web-react';

import { useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';
import { IconDown, IconPause, IconSend } from '@arco-design/web-react/icon';
import { useMessageStateStoreShallow } from '@refly-packages/ai-workspace-common/stores/message-state';
import { useSkillStoreShallow } from '@refly-packages/ai-workspace-common/stores/skill';
import { useTranslation } from 'react-i18next';
import { useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';

// components
import { ModelSelector } from './model-selector';

// styles
import './index.scss';
import { OutputLocaleList } from '@refly-packages/ai-workspace-common/components/output-locale-list';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { useSubscriptionStoreShallow } from '@refly-packages/ai-workspace-common/stores/subscription';

interface ChatActionsProps {
  form?: FormInstance;
  handleSendMessage: () => void;
  handleAbort: () => void;
}

export const ChatActions = (props: ChatActionsProps) => {
  const { handleSendMessage, handleAbort } = props;

  const { t } = useTranslation();

  // stores
  const chatStore = useChatStoreShallow((state) => ({
    newQAText: state.newQAText,
    enableWebSearch: state.enableWebSearch,
    setEnableWebSearch: state.setEnableWebSearch,
    enableKnowledgeBaseSearch: state.enableKnowledgeBaseSearch,
    setEnableKnowledgeBaseSearch: state.setEnableKnowledgeBaseSearch,
  }));
  const messageStateStore = useMessageStateStoreShallow((state) => ({
    pending: state.pending,
  }));
  const skillStore = useSkillStoreShallow((state) => ({
    selectedSkill: state.selectedSkill,
  }));

  const { tokenUsage } = useSubscriptionStoreShallow((state) => ({
    tokenUsage: state.tokenUsage,
  }));
  const tokenAvailable =
    tokenUsage?.t1TokenQuota > tokenUsage?.t1TokenUsed || tokenUsage?.t2TokenQuota > tokenUsage?.t2TokenUsed;

  // hooks
  const runtime = getRuntime();
  const isWeb = runtime === 'web';

  const userStore = useUserStoreShallow((state) => ({
    isLogin: state.isLogin,
    setLoginModalVisible: state.setLoginModalVisible,
  }));

  const canSendEmptyMessage = skillStore?.selectedSkill || (!skillStore?.selectedSkill && chatStore.newQAText?.trim());
  const canSendMessage = !userStore.isLogin || (!messageStateStore?.pending && tokenAvailable && canSendEmptyMessage);

  return (
    <div className="chat-actions">
      <div className="left-actions">
        <ModelSelector />
        {/* <OutputLocaleList /> */}
        {!skillStore?.selectedSkill?.skillId ? (
          <div className="chat-action-item" onClick={() => chatStore.setEnableWebSearch(!chatStore.enableWebSearch)}>
            <Checkbox checked={chatStore.enableWebSearch} />
            <span className="chat-action-item-text">{t('copilot.webSearch.title')}</span>
          </div>
        ) : null}
        {!skillStore?.selectedSkill?.skillId ? (
          <div
            className="chat-action-item"
            onClick={() => chatStore.setEnableKnowledgeBaseSearch(!chatStore.enableKnowledgeBaseSearch)}
          >
            <Checkbox checked={chatStore.enableKnowledgeBaseSearch} />
            <span className="chat-action-item-text">{t('copilot.knowledgeBaseSearch.title')}</span>
          </div>
        ) : null}
      </div>
      <div className="right-actions">
        {messageStateStore?.pending ? (
          <Button
            size="mini"
            icon={<IconPause />}
            className="search-btn"
            style={{ color: '#FFF', background: '#000', height: '24px' }}
            onClick={() => {
              handleAbort();
            }}
          ></Button>
        ) : null}
        {messageStateStore?.pending && !isWeb ? null : (
          <Button
            size="mini"
            icon={<IconSend />}
            loading={messageStateStore?.pending}
            disabled={messageStateStore?.pending}
            className="search-btn"
            style={{ color: '#FFF', background: '#00968F' }}
            onClick={() => {
              handleSendMessage();
            }}
          >
            {t('copilot.chatActions.send')}
          </Button>
        )}
      </div>
    </div>
  );
};
