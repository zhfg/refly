import { Button, Dropdown, MenuProps, Switch } from 'antd';
import { FormInstance, Checkbox } from '@arco-design/web-react';

import { useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';
import { IconDown, IconPause, IconSend, IconSettings } from '@arco-design/web-react/icon';
import { useMessageStateStoreShallow } from '@refly-packages/ai-workspace-common/stores/message-state';
import { useSkillStoreShallow } from '@refly-packages/ai-workspace-common/stores/skill';
import { useTranslation } from 'react-i18next';
import { useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';

// components
import { ModelSelector } from './model-selector';
import { ProjectSelector } from './project-selector';

// styles
import './index.scss';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { useSubscriptionStoreShallow } from '@refly-packages/ai-workspace-common/stores/subscription';
import { useProjectContext } from '@refly-packages/ai-workspace-common/components/project-detail/context-provider';

interface ChatActionsProps {
  form?: FormInstance;
  handleSendMessage: () => void;
  handleAbort: () => void;
}

export const ChatActions = (props: ChatActionsProps) => {
  const { handleSendMessage, handleAbort } = props;

  const { t } = useTranslation();
  const { projectId: envProjectId } = useProjectContext();

  // stores
  const chatStore = useChatStoreShallow((state) => ({
    newQAText: state.newQAText,
    enableWebSearch: state.enableWebSearch,
    setEnableWebSearch: state.setEnableWebSearch,
    enableKnowledgeBaseSearch: state.enableKnowledgeBaseSearch,
    setEnableKnowledgeBaseSearch: state.setEnableKnowledgeBaseSearch,
    enableAutoImportWebResource: state.enableAutoImportWebResource,
    setEnableAutoImportWebResource: state.setEnableAutoImportWebResource,
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

  const settingsItems: MenuProps['items'] = [
    {
      key: 'enableAutoImportWebResource',
      label: (
        <div
          className="text-xs flex items-center gap-2"
          onClick={(e) => {
            e.stopPropagation();
            chatStore.setEnableAutoImportWebResource(!chatStore.enableAutoImportWebResource);
          }}
        >
          <Switch size="small" checked={chatStore.enableAutoImportWebResource} />
          <span className="chat-action-item-text">{t('copilot.autoImportWebResource.title')}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="chat-actions">
      <div className="left-actions">
        <ModelSelector />
        {!skillStore?.selectedSkill?.skillId ? (
          <div className="chat-action-item" onClick={() => chatStore.setEnableWebSearch(!chatStore.enableWebSearch)}>
            <Switch size="small" checked={chatStore.enableWebSearch} />
            <span className="chat-action-item-text">{t('copilot.webSearch.title')}</span>
          </div>
        ) : null}
        {!skillStore?.selectedSkill?.skillId ? (
          <div
            className="chat-action-item"
            onClick={() => chatStore.setEnableKnowledgeBaseSearch(!chatStore.enableKnowledgeBaseSearch)}
          >
            <Switch size="small" checked={chatStore.enableKnowledgeBaseSearch} />
            <span className="chat-action-item-text">{t('copilot.knowledgeBaseSearch.title')}</span>
          </div>
        ) : null}
        <Dropdown className="chat-action-item" trigger={['click']} menu={{ items: settingsItems }}>
          <a onClick={(e) => e.preventDefault()}>
            <IconSettings fontSize={14} />
            <span className="chat-action-item-text">{t('copilot.moreSettings')}</span>
            <IconDown />
          </a>
        </Dropdown>
        {!envProjectId ? <ProjectSelector /> : null}
      </div>
      <div className="right-actions">
        {messageStateStore?.pending ? (
          <Button
            size="small"
            icon={<IconPause />}
            onClick={() => {
              handleAbort();
            }}
          ></Button>
        ) : null}
        {messageStateStore?.pending && !isWeb ? null : (
          <Button
            size="small"
            type="primary"
            icon={<IconSend />}
            loading={messageStateStore?.pending}
            disabled={messageStateStore?.pending}
            className="text-xs gap-1"
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
