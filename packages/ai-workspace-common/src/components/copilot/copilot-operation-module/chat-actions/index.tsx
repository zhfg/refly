import { Button, Dropdown, Menu, FormInstance, Checkbox } from '@arco-design/web-react';

import { ChatMode, useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';
import { IconDown, IconPause, IconSend } from '@arco-design/web-react/icon';
import { useMessageStateStoreShallow } from '@refly-packages/ai-workspace-common/stores/message-state';
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
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
import { useProjectContext } from '@refly-packages/ai-workspace-common/components/project-detail/context-provider';

interface ChatActionsProps {
  form?: FormInstance;
}

export const ChatActions = (props: ChatActionsProps) => {
  const { form } = props;
  const { projectId } = useProjectContext();

  const { t } = useTranslation();

  // stores
  const chatStore = useChatStoreShallow((state) => ({
    newQAText: state.newQAText,
    chatMode: state.chatMode,
    setChatMode: state.setChatMode,
    enableWebSearch: state.enableWebSearch,
    setEnableWebSearch: state.setEnableWebSearch,
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

  const { sendChatMessage, buildShutdownTaskAndGenResponse } = useBuildThreadAndRun();

  // hooks
  const runtime = getRuntime();
  const isWeb = runtime === 'web';

  const userStore = useUserStoreShallow((state) => ({
    isLogin: state.isLogin,
    setLoginModalVisible: state.setLoginModalVisible,
  }));

  const handleSendMessage = (chatMode: ChatMode) => {
    const tplConfig = form?.getFieldValue('tplConfig');
    sendChatMessage({ chatMode, projectId, tplConfig });
  };

  const handleAbort = () => {
    buildShutdownTaskAndGenResponse();
  };

  const canSendEmptyMessage = skillStore?.selectedSkill || (!skillStore?.selectedSkill && chatStore.newQAText?.trim());
  const canSendMessage = !userStore.isLogin || (!messageStateStore?.pending && tokenAvailable && canSendEmptyMessage);

  return (
    <div className="chat-actions">
      <div className="left-actions">
        <ModelSelector />
        <OutputLocaleList />
        {!skillStore?.selectedSkill?.skillId ? (
          <div className="chat-action-item" onClick={() => chatStore.setEnableWebSearch(!chatStore.enableWebSearch)}>
            <Checkbox checked={chatStore.enableWebSearch} />
            <span className="chat-action-item-text">{t('copilot.webSearch.title')}</span>
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
        {skillStore?.selectedSkill?.skillId || messageStateStore?.pending ? (
          isWeb ? (
            <Button
              size="mini"
              icon={<IconSend />}
              loading={messageStateStore?.pending}
              disabled={messageStateStore?.pending}
              className="search-btn"
              style={{ color: '#FFF', background: '#00968F' }}
              onClick={() => {
                handleSendMessage('normal');
              }}
            >
              {t('copilot.chatActions.send')}
            </Button>
          ) : null
        ) : (
          <Dropdown
            position="tr"
            disabled={!canSendMessage}
            droplist={
              <Menu>
                <Menu.Item
                  key="noContext"
                  className="h-8 text-xs leading-8"
                  onClick={() => {
                    handleSendMessage('noContext');
                  }}
                >
                  {t('copilot.chatMode.noContext')}
                </Menu.Item>
                <Menu.Item
                  key="wholeSpace"
                  className="h-8 text-xs leading-8"
                  onClick={() => {
                    handleSendMessage('wholeSpace');
                  }}
                >
                  {t('copilot.chatMode.wholeSpace')}
                </Menu.Item>
              </Menu>
            }
          >
            <Button
              size="mini"
              type="primary"
              icon={<IconSend />}
              loading={messageStateStore?.pending}
              disabled={!canSendMessage}
              className="search-btn"
              onClick={() => {
                handleSendMessage('normal');
              }}
            >
              {t('copilot.chatActions.send')}
              <IconDown />
            </Button>
          </Dropdown>
        )}
      </div>
    </div>
  );
};
