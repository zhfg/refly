import React, { useRef, useState } from 'react';
import { Button, Input, Dropdown, Menu, Notification, FormInstance } from '@arco-design/web-react';

import type { RefTextAreaType } from '@arco-design/web-react/es/Input/textarea';
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
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
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [image, setImage] = useState(null);
  const [language, setLanguage] = useState('en');
  const [sendType, setSendType] = useState('direct');

  const inputRef = useRef<RefTextAreaType>(null);
  // stores
  const chatStore = useChatStore();
  const searchStore = useSearchStore();
  const conversationStore = useConversationStore();
  const messageStateStore = useMessageStateStore();
  const skillStore = useSkillStore();
  const { runSkill, emptyConvRunSkill, buildShutdownTaskAndGenResponse } = useBuildThreadAndRun();
  // hooks
  const [isFocused, setIsFocused] = useState(false);

  const { handleFilterErrorTip } = useContextFilterErrorTip();

  const handleSendMessage = (type) => {
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

    setSendType(type);

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
      </div>
      <div className="ai-copilot-chat-input-action">
        {messageStateStore?.pending ? (
          <Button
            size="mini"
            icon={<IconPause />}
            className="search-btn"
            style={{ color: '#FFF', background: '#000', height: '24px', marginRight: '8px' }}
            onClick={() => {
              handleAbort();
            }}
          ></Button>
        ) : null}
        <Dropdown
          position="tr"
          droplist={
            <Menu>
              <Menu.Item key="direct" onClick={() => handleSendMessage('direct')}>
                直接聊天
              </Menu.Item>
              <Menu.Item key="noContext" onClick={() => handleSendMessage('noContext')}>
                不带上下文聊天
              </Menu.Item>
              <Menu.Item key="wholeSpace" onClick={() => handleSendMessage('wholeSpace')}>
                在整个空间聊天
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
              handleSendMessage('direct');
            }}
          >
            发送
          </Button>
        </Dropdown>
      </div>
    </div>
  );
};
