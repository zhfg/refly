import { Button, Checkbox, Tooltip } from '@arco-design/web-react';

import { IconClose, IconEdit, IconFile, IconHistory, IconPlus, IconSearch } from '@arco-design/web-react/icon';
import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';

// state
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useConversationStore } from '@refly-packages/ai-workspace-common/stores/conversation';
import { useKnowledgeBaseStore } from '../../../stores/knowledge-base';
// utils
import { useMessageStateStore } from '@refly-packages/ai-workspace-common/stores/message-state';
import classNames from 'classnames';

import { useSearchStoreShallow } from '@refly-packages/ai-workspace-common/stores/search';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';

import { useCopilotStore } from '@refly-packages/ai-workspace-common/stores/copilot';
import { getClientOrigin } from '@refly-packages/utils/url';

import Logo from '@/assets/logo.svg';

// styles
import './index.scss';
import { useTranslation } from 'react-i18next';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';
import { useJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';

interface CopilotChatHeaderProps {
  source: MessageIntentSource;
  disable?: boolean;
}

export const CopilotChatHeader = (props: CopilotChatHeaderProps) => {
  const { disable, source } = props;
  const { jumpToConv } = useJumpNewPath();

  const { t } = useTranslation();

  const [searchParams, setSearchParams] = useSearchParams();
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
    currentConversation: state.currentConversation,
    resetState: state.resetState,
    setCurrentConversation: state.setCurrentConversation,
  }));
  const messageStateStore = useMessageStateStore((state) => ({
    pending: state.pending,
    pendingFirstToken: state.pendingFirstToken,
    resetState: state.resetState,
  }));
  const canvasStore = useCanvasStoreShallow((state) => ({
    notePanelVisible: state.canvasPanelVisible,
    updateNotePanelVisible: state.updateCanvasPanelVisible,
  }));
  const searchStore = useSearchStoreShallow((state) => ({
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
    if ([MessageIntentSource.ConversationList, MessageIntentSource.ConversationDetail].includes(source)) {
      jumpToConv({
        convId: 'new',
      });
    } else {
      searchParams.delete('convId');
      setSearchParams(searchParams);
    }

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
                        <Tooltip
                          key="resourcePanel"
                          content={t('knowledgeBase.header.searchAndOpenResourceOrCollection')}
                          getPopupContainer={getPopupContainer}
                        >
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
                            className={classNames('assist-action-item-header', { active: checked })}
                          ></Button>
                        </Tooltip>
                      );
                    }}
                  </Checkbox>,
                  <Checkbox key={'knowledge-base-note-panel'} checked={canvasStore.notePanelVisible}>
                    {({ checked }) => {
                      return (
                        <Tooltip
                          key="notePanel"
                          content={t('knowledgeBase.header.searchOrOpenNote')}
                          getPopupContainer={getPopupContainer}
                        >
                          <Button
                            icon={<IconEdit />}
                            type="text"
                            onClick={() => {
                              canvasStore.updateNotePanelVisible(!canvasStore.notePanelVisible);
                            }}
                            className={classNames('assist-action-item-header', { active: checked })}
                          ></Button>
                        </Tooltip>
                      );
                    }}
                  </Checkbox>,
                  <Tooltip
                    key="searchOrOpenThread"
                    content={t('knowledgeBase.header.searchOrOpenThread')}
                    getPopupContainer={getPopupContainer}
                  >
                    <Button
                      icon={<IconSearch />}
                      type="text"
                      onClick={() => {
                        searchStore.setPages(searchStore.pages.concat('convs'));
                        searchStore.setIsSearchOpen(true);
                      }}
                      style={{ marginLeft: '5px' }}
                      className={classNames('assist-action-item-header')}
                    ></Button>
                  </Tooltip>,
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
            <Tooltip
              key="threadHistory"
              content={t('knowledgeBase.header.openThreadHistory')}
              getPopupContainer={getPopupContainer}
            >
              <Button
                icon={<IconHistory />}
                type="text"
                onClick={() => {
                  handleNewOpenConvList();
                }}
                className={classNames('assist-action-item-header')}
              >
                {/* 会话历史 */}
              </Button>
            </Tooltip>
            <Tooltip
              key="newThread"
              content={t('knowledgeBase.header.newThread')}
              getPopupContainer={getPopupContainer}
            >
              <Button
                icon={<IconPlus />}
                type="text"
                onClick={() => {
                  handleNewTempConv();
                }}
                className={classNames('assist-action-item-header', 'mr-1')}
              >
                {/* 新会话 */}
              </Button>
            </Tooltip>
            {runtime === 'extension-csui' ? (
              <Button
                icon={<IconClose />}
                type="text"
                onClick={(_) => {
                  if (runtime === 'extension-csui') {
                    copilotStore.setIsCopilotOpen(false);
                  }
                }}
                className={classNames('assist-action-item-header', 'mr-1')}
              ></Button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};
