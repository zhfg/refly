import { Button, Dropdown, MenuProps, Switch } from 'antd';
import { FormInstance } from '@arco-design/web-react';
import { useEffect, useRef, useState } from 'react';

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
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';

interface ChatActionsProps {
  form?: FormInstance;
  handleSendMessage: () => void;
  handleAbort: () => void;
  source: MessageIntentSource;
}

export const ChatActions = (props: ChatActionsProps) => {
  const { handleSendMessage, handleAbort, source } = props;

  const { t } = useTranslation();
  const { projectId: envProjectId } = useProjectContext();

  // stores
  const chatStore = useChatStoreShallow((state) => ({
    newQAText: state.newQAText,
    enableWebSearch: state.enableWebSearch,
    setEnableWebSearch: state.setEnableWebSearch,
    enableKnowledgeBaseSearch: state.enableKnowledgeBaseSearch,
    setEnableKnowledgeBaseSearch: state.setEnableKnowledgeBaseSearch,
    enableDeepReasonWebSearch: state.enableDeepReasonWebSearch,
    setEnableDeepReasonWebSearch: state.setEnableDeepReasonWebSearch,
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
  const hideProjectSelector = envProjectId || !isWeb || [MessageIntentSource.Share].includes(source);

  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const COLLAPSE_WIDTH = 600; // Adjust this threshold as needed

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const settingsItems: MenuProps['items'] = [
    ...(containerWidth < COLLAPSE_WIDTH
      ? [
          {
            key: 'webSearch',
            label: !skillStore?.selectedSkill?.skillId ? (
              <div
                className="text-xs flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  chatStore.setEnableWebSearch(!chatStore.enableWebSearch);
                }}
              >
                <Switch size="small" checked={chatStore.enableWebSearch} />
                <span className="chat-action-item-text">{t('copilot.webSearch.title')}</span>
              </div>
            ) : null,
          },
          {
            key: 'knowledgeBase',
            label: !skillStore?.selectedSkill?.skillId ? (
              <div
                className="text-xs flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  chatStore.setEnableKnowledgeBaseSearch(!chatStore.enableKnowledgeBaseSearch);
                }}
              >
                <Switch size="small" checked={chatStore.enableKnowledgeBaseSearch} />
                <span className="chat-action-item-text">{t('copilot.knowledgeBaseSearch.title')}</span>
              </div>
            ) : null,
          },
        ]
      : []),
    {
      key: 'enableDeepReasonWebSearch',
      label: (
        <div
          className="text-xs flex items-center gap-2"
          onClick={(e) => {
            e.stopPropagation();
            chatStore.setEnableDeepReasonWebSearch(!chatStore.enableDeepReasonWebSearch);
          }}
        >
          <Switch size="small" checked={chatStore.enableDeepReasonWebSearch} />
          <span className="chat-action-item-text">{t('copilot.deepReasonWebSearch.title')}</span>
        </div>
      ),
    },
  ].filter((item) => item.label !== null);

  return (
    <div className="chat-actions" ref={containerRef}>
      <div className="left-actions">
        <ModelSelector />
        {containerWidth >= COLLAPSE_WIDTH && !skillStore?.selectedSkill?.skillId ? (
          <div className="chat-action-item" onClick={() => chatStore.setEnableWebSearch(!chatStore.enableWebSearch)}>
            <Switch size="small" checked={chatStore.enableWebSearch} />
            <span className="chat-action-item-text">{t('copilot.webSearch.title')}</span>
          </div>
        ) : null}
        {containerWidth >= COLLAPSE_WIDTH && !skillStore?.selectedSkill?.skillId ? (
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
        {!hideProjectSelector ? <ProjectSelector /> : null}
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
            disabled={!canSendMessage}
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
