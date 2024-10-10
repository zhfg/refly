import React, { useRef, useState } from 'react';
import { Button, Input, Dropdown, Menu, Notification, FormInstance, Switch } from '@arco-design/web-react';

import type { RefTextAreaType } from '@arco-design/web-react/es/Input/textarea';
import { ChatMode, useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useQuickSearchStateStore } from '@refly-packages/ai-workspace-common/stores/quick-search-state';
import { IconClose, IconFile, IconFontColors, IconPause, IconSend, IconStop } from '@arco-design/web-react/icon';
import { useMessageStateStore } from '@refly-packages/ai-workspace-common/stores/message-state';
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { buildConversation } from '@refly-packages/ai-workspace-common/utils/conversation';
import { useConversationStore } from '@refly-packages/ai-workspace-common/stores/conversation';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { useSearchStore } from '@refly-packages/ai-workspace-common/stores/search';
import { useContextFilterErrorTip } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/copilot-operation-module/context-manager/hooks/use-context-filter-errror-tip';
import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';
import { SkillAvatar } from '@refly-packages/ai-workspace-common/components/skill/skill-avatar';
import { useTranslation } from 'react-i18next';
import { SkillTemplateConfig } from '@refly/openapi-schema';

// components
import { ModelSelector } from './model-selector';

// styles
import './index.scss';
import { OutputLocaleList } from '@refly-packages/ai-workspace-common/components/output-locale-list';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';

interface ChatActionsProps {
  form?: FormInstance;
}

export const ChatActions = (props: ChatActionsProps) => {
  const { form } = props;
  const { t } = useTranslation();
  const [image, setImage] = useState(null);

  const inputRef = useRef<RefTextAreaType>(null);
  // stores
  const chatStore = useChatStore((state) => ({
    chatMode: state.chatMode,
    setChatMode: state.setChatMode,
    enableWebSearch: state.enableWebSearch,
    setEnableWebSearch: state.setEnableWebSearch,
  }));
  const searchStore = useSearchStore();
  const conversationStore = useConversationStore();
  const messageStateStore = useMessageStateStore();
  const skillStore = useSkillStore((state) => ({
    selectedSkill: state.selectedSkill,
  }));
  const { runSkill, emptyConvRunSkill, buildShutdownTaskAndGenResponse } = useBuildThreadAndRun();
  // hooks
  const [isFocused, setIsFocused] = useState(false);

  const { handleFilterErrorTip } = useContextFilterErrorTip();

  const handleSendMessage = (type: ChatMode) => {
    const error = handleFilterErrorTip();
    if (error) {
      return;
    }

    const { formErrors } = useContextPanelStore.getState();
    if (formErrors && Object.keys(formErrors).length > 0) {
      Notification.error({
        style: { width: 400 },
        title: t('copilot.configManager.errorTipTitle'),
        content: t('copilot.configManager.errorTip'),
      });
      return;
    }

    chatStore.setChatMode(type);

    const { messages, newQAText } = useChatStore.getState();
    searchStore.setIsSearchOpen(false);
    const tplConfig = form?.getFieldValue('tplConfig');
    const invokeParams = { tplConfig: tplConfig };

    if (messages?.length > 0) {
      // 追问阅读
      runSkill(newQAText, invokeParams);
    } else {
      // 新会话阅读，先创建会话，然后进行跳转之后发起聊天
      emptyConvRunSkill(newQAText, true, invokeParams);
    }
  };

  const handleAbort = () => {
    buildShutdownTaskAndGenResponse();
  };

  return (
    <div className="chat-actions">
      <div className="left-actions">
        {/* <Button className={'action-btn'} icon={<IconFile />} size="mini" type="text">
          上传图片
        </Button> */}
        <ModelSelector />
        <OutputLocaleList />
        {!skillStore?.selectedSkill?.skillId ? (
          <div className="chat-action-item" onClick={() => chatStore.setEnableWebSearch(!chatStore.enableWebSearch)}>
            <Switch type="round" size="small" checked={chatStore.enableWebSearch} />
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
        {skillStore?.selectedSkill?.skillId ? (
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
            {t('copilot.send')}
          </Button>
        ) : (
          <Dropdown
            position="tr"
            droplist={
              <Menu>
                <Menu.Item key="direct" onClick={() => handleSendMessage('normal')}>
                  {t('copilot.chatMode.normal')}
                </Menu.Item>
                <Menu.Item key="noContext" onClick={() => handleSendMessage('noContext')}>
                  {t('copilot.chatMode.noContext')}
                </Menu.Item>
                <Menu.Item key="wholeSpace" onClick={() => handleSendMessage('wholeSpace')}>
                  {t('copilot.chatMode.wholeSpace')}
                </Menu.Item>
              </Menu>
            }
          >
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
              {t('copilot.send')}
            </Button>
          </Dropdown>
        )}
      </div>
    </div>
  );
};
