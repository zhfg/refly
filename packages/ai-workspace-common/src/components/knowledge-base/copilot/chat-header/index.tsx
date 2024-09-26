import { Button, Checkbox } from '@arco-design/web-react';

// 自定义组件
import { IconClose, IconEdit, IconFile, IconHistory, IconPlusCircle, IconSearch } from '@arco-design/web-react/icon';
// 自定义样式
// 自定义组件
import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';

// state
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useConversationStore } from '@refly-packages/ai-workspace-common/stores/conversation';
import { useKnowledgeBaseStore } from '../../../../stores/knowledge-base';
// utils
import { useMessageStateStore } from '@refly-packages/ai-workspace-common/stores/message-state';
import classNames from 'classnames';

import { useSearchStore } from '@refly-packages/ai-workspace-common/stores/search';
import { useNoteStore } from '@refly-packages/ai-workspace-common/stores/note';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';

import { useCopilotStore } from '@refly-packages/ai-workspace-common/stores/copilot';
import { getClientOrigin } from '@refly-packages/utils/url';

import Logo from '@/assets/logo.svg';

// styles
import './index.scss';

interface CopilotChatHeaderProps {
  disable?: boolean;
}

export const CopilotChatHeader = (props: CopilotChatHeaderProps) => {
  const { disable } = props;

  const [searchParams] = useSearchParams();
  const noteId = searchParams.get('noteId');
  const resId = searchParams.get('resId');

  // 所属的环境
  const runtime = getRuntime();
  const isWeb = runtime === 'web';

  const copilotStore = useCopilotStore();

  const knowledgeBaseStore = useKnowledgeBaseStore((state) => ({
    resourcePanelVisible: state.resourcePanelVisible,
    kbModalVisible: state.kbModalVisible,
    actionSource: state.actionSource,
    tempConvResources: state.tempConvResources,
    updateConvModalVisible: state.updateConvModalVisible,
    updateResourcePanelVisible: state.updateResourcePanelVisible,
    currentKnowledgeBase: state.currentKnowledgeBase,
    convModalVisible: state.convModalVisible,
    sourceListModalVisible: state.sourceListModalVisible,
  }));
  const conversationStore = useConversationStore((state) => ({
    isNewConversation: state.isNewConversation,
    currentConversation: state.currentConversation,
    resetState: state.resetState,
    setCurrentConversation: state.setCurrentConversation,
    setIsNewConversation: state.setIsNewConversation,
  }));
  const messageStateStore = useMessageStateStore((state) => ({
    pending: state.pending,
    pendingFirstToken: state.pendingFirstToken,
    resetState: state.resetState,
  }));
  const noteStore = useNoteStore((state) => ({
    notePanelVisible: state.notePanelVisible,
    updateNotePanelVisible: state.updateNotePanelVisible,
  }));
  const searchStore = useSearchStore((state) => ({
    pages: state.pages,
    isSearchOpen: state.isSearchOpen,
    setPages: state.setPages,
    setIsSearchOpen: state.setIsSearchOpen,
  }));
  const chatStore = useChatStore((state) => ({
    messages: state.messages,
    resetState: state.resetState,
    setMessages: state.setMessages,
    setInvokeParams: state.setInvokeParams,
  }));

  const handleNewTempConv = () => {
    conversationStore.resetState();
    chatStore.resetState();
    messageStateStore.resetState();
  };

  const handleNewOpenConvList = () => {
    knowledgeBaseStore.updateConvModalVisible(true);
  };

  return (
    <div className="knowledge-base-detail-header">
      {!disable && (
        <>
          <div className="knowledge-base-detail-navigation-bar">
            {isWeb
              ? [
                  <Checkbox
                    key={'knowledge-base-resource-panel'}
                    checked={knowledgeBaseStore.resourcePanelVisible && resId ? true : false}
                  >
                    {({ checked }) => {
                      return (
                        <Button
                          icon={<IconFile />}
                          type="text"
                          onClick={() => {
                            if (!resId) {
                              searchStore.setPages(searchStore.pages.concat('knowledgeBases'));
                              searchStore.setIsSearchOpen(true);
                            } else {
                              knowledgeBaseStore.updateResourcePanelVisible(!knowledgeBaseStore.resourcePanelVisible);
                            }
                          }}
                          className={classNames('assist-action-item', { active: checked })}
                        ></Button>
                      );
                    }}
                  </Checkbox>,
                  <Checkbox key={'knowledge-base-note-panel'} checked={noteStore.notePanelVisible}>
                    {({ checked }) => {
                      return (
                        <Button
                          icon={<IconEdit />}
                          type="text"
                          onClick={() => {
                            noteStore.updateNotePanelVisible(!noteStore.notePanelVisible);
                          }}
                          className={classNames('assist-action-item', { active: checked })}
                        ></Button>
                      );
                    }}
                  </Checkbox>,
                  <Button
                    icon={<IconSearch />}
                    type="text"
                    onClick={() => {
                      searchStore.setPages(searchStore.pages.concat('convs'));
                      searchStore.setIsSearchOpen(true);
                    }}
                    className={classNames('assist-action-item')}
                  ></Button>,
                ]
              : null}
            {!isWeb ? (
              <div
                className="chat-header__brand"
                onClick={() => {
                  window.open(`${getClientOrigin()}/`, '_blank');
                }}
              >
                <>
                  <img src={Logo} alt="Refly" />
                  <span>Refly</span>
                </>
              </div>
            ) : null}
          </div>
          <div className="knowledge-base-detail-navigation-bar">
            <Button
              icon={<IconHistory />}
              type="text"
              onClick={() => {
                handleNewOpenConvList();
              }}
              className={classNames('assist-action-item')}
            >
              {/* 会话历史 */}
            </Button>
            <Button
              icon={<IconPlusCircle />}
              type="text"
              onClick={() => {
                handleNewTempConv();
              }}
              className={classNames('assist-action-item', 'mr-1')}
            >
              {/* 新会话 */}
            </Button>
            {runtime === 'extension-csui' ? (
              <Button
                icon={<IconClose />}
                type="text"
                onClick={(_) => {
                  if (runtime === 'extension-csui') {
                    copilotStore.setIsCopilotOpen(false);
                  }
                }}
                className={classNames('assist-action-item', 'mr-1')}
              ></Button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};
