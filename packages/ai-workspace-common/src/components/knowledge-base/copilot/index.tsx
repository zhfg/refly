import { Button, Checkbox } from '@arco-design/web-react';

// 自定义组件
import {
  IconCaretDown,
  IconEdit,
  IconFile,
  IconFolder,
  IconFontColors,
  IconHistory,
  IconMessage,
  IconPlusCircle,
  IconSearch,
  IconSettings,
  IconTranslate,
} from '@arco-design/web-react/icon';
// 自定义样式
import './index.scss';
// 自定义组件
import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { SearchTarget, useSearchStateStore } from '@refly-packages/ai-workspace-common/stores/search-state';
import { ContextStateDisplay } from './context-state-display/index';
import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';
import { useEffect, useState } from 'react';
import { ChatInput } from './chat-input';
import { ChatMessages } from './chat-messages';
import { ConvListModal } from './conv-list-modal';
import { KnowledgeBaseListModal } from './knowledge-base-list-modal';
import { SkillManagementModal } from '@refly-packages/ai-workspace-common/components/skill/skill-management-modal';
import { SkillDisplay } from './skill-display';

// requests
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

// state
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useConversationStore } from '@refly-packages/ai-workspace-common/stores/conversation';
import { useResetState } from '@refly-packages/ai-workspace-common/hooks/use-reset-state';
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { delay } from '@refly-packages/ai-workspace-common/utils/delay';
import { ActionSource } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useKnowledgeBaseStore } from '../../../stores/knowledge-base';
// utils
import { LOCALE } from '@refly/common-types';
import { localeToLanguageName } from '@refly-packages/ai-workspace-common/utils/i18n';
import { OutputLocaleList } from '@refly-packages/ai-workspace-common/components/output-locale-list';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { SourceListModal } from '@refly-packages/ai-workspace-common/components/source-list/source-list-modal';
import { useResizeCopilot } from '@refly-packages/ai-workspace-common/hooks/use-resize-copilot';
import { useMessageStateStore } from '@refly-packages/ai-workspace-common/stores/message-state';
import { RegisterSkillComponent } from '@refly-packages/ai-workspace-common/skills/main-logic/register-skill-component';
import { KnowledgeBaseNavHeader } from '@refly-packages/ai-workspace-common/components/knowledge-base/nav-header';
import classNames from 'classnames';
import { useAINote } from '@refly-packages/ai-workspace-common/hooks/use-ai-note';
import { useSkillManagement } from '@refly-packages/ai-workspace-common/hooks/use-skill-management';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { useSearchStore } from '@refly-packages/ai-workspace-common/stores/search';
import { ContextContentWithBadge } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-panel';
import { useNoteStore } from '@refly-packages/ai-workspace-common/stores/note';
import { useDynamicInitContextPanelState } from '@refly-packages/ai-workspace-common/hooks/use-init-context-panel-state';
import { SelectedTextContextActionBtn } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-state-display//action-btn/selected-text-context-action-btn';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { CurrentContextActionBtn } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-state-display/action-btn/current-context-action-btn';

interface AICopilotProps {
  disable?: boolean;
  source?: string;
  jobId?: string;
}

export const AICopilot = (props: AICopilotProps) => {
  // 所属的环境
  const runtime = getRuntime();
  const isWeb = runtime === 'web';

  const [searchParams] = useSearchParams();
  const [copilotBodyHeight, setCopilotBodyHeight] = useState(215 - 32);
  const userStore = useUserStore();
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const noteStore = useNoteStore();
  const searchStore = useSearchStore();
  const { contextCardHeight, showContextCard, showContextState } = useCopilotContextState();
  const chatStore = useChatStore();
  const conversationStore = useConversationStore();
  const [isFetching, setIsFetching] = useState(false);
  const { runSkill } = useBuildThreadAndRun();
  const searchStateStore = useSearchStateStore();
  const messageStateStore = useMessageStateStore();
  const skillStore = useSkillStore();

  console.log('useKnowledgeBaseStore state update from packages', knowledgeBaseStore.resourcePanelVisible);

  const convId = searchParams.get('convId');
  const noteId = searchParams.get('noteId');
  const resId = searchParams.get('resId');
  const { resetState } = useResetState();
  const actualCopilotBodyHeight =
    copilotBodyHeight + (showContextCard ? contextCardHeight : 0) + (skillStore?.selectedSkill ? 32 : 0) - 16;

  const { t, i18n } = useTranslation();
  const uiLocale = i18n?.languages?.[0] as LOCALE;
  const outputLocale = userStore?.localSettings?.outputLocale || 'en';
  console.log('uiLocale', uiLocale);

  const { disable, jobId, source } = props;

  const isFromSkillJob = () => {
    return source === 'skillJob';
  };

  // ai-note handler
  useAINote(true);
  const { handleGetSkillInstances, handleGetSkillTemplates } = useSkillManagement();

  const handleSwitchSearchTarget = () => {
    if (showContextState) {
      searchStateStore.setSearchTarget(SearchTarget.CurrentPage);
    }
  };

  const handleNewTempConv = () => {
    conversationStore.resetState();
    chatStore.resetState();
    messageStateStore.resetState();
  };

  const handleNewOpenConvList = () => {
    knowledgeBaseStore.updateConvModalVisible(true);
  };

  const handleGetThreadMessages = async (convId: string) => {
    // 异步操作
    const { data: res, error } = await getClient().getConversationDetail({
      path: {
        convId,
      },
    });

    console.log('getThreadMessages', res, error);

    if (error) {
      throw error;
    }

    // 清空之前的状态
    resetState();

    // 设置会话和消息
    if (res?.data) {
      conversationStore.setCurrentConversation(res?.data);
    }

    chatStore.setMessages(res.data.messages);
  };

  const getThreadMessagesByJobId = async (jobId: string) => {
    setIsFetching(true);
    try {
      const { data: res, error } = await getClient().getSkillJobDetail({
        query: {
          jobId,
        },
      });

      if (error) {
        throw error;
      }

      // 清空之前的状态
      resetState();

      setIsFetching(false);
      chatStore.setMessages(res?.data?.messages || []);
    } catch (error) {
      console.log('getThreadMessagesByJobId error', error);
    }
  };

  const handleConvTask = async (convId: string) => {
    try {
      setIsFetching(true);
      const { newQAText } = useChatStore.getState();
      const { isNewConversation } = useConversationStore.getState();

      // 新会话，需要手动构建第一条消息
      if (isNewConversation && convId && newQAText) {
        // 更换成基于 task 的消息模式，核心是基于 task 来处理
        runSkill(newQAText);
      } else if (convId) {
        handleGetThreadMessages(convId);
      }
    } catch (err) {
      console.log('thread error');
    }

    await delay(1500);
    setIsFetching(false);

    // reset state
    conversationStore.setIsNewConversation(false);
  };

  useEffect(() => {
    if (convId && !isFromSkillJob()) {
      handleConvTask(convId);
    }

    if (jobId && isFromSkillJob()) {
      getThreadMessagesByJobId(jobId);
    }

    return () => {
      chatStore.setMessages([]);
    };
  }, [convId, jobId]);

  useEffect(() => {
    handleSwitchSearchTarget();
  }, [showContextState]);

  useResizeCopilot({ containerSelector: 'ai-copilot-container' });
  useDynamicInitContextPanelState(); // 动态根据页面状态更新上下文面板状态

  useEffect(() => {
    if (isFromSkillJob()) return;
    handleGetSkillInstances();
    handleGetSkillTemplates();
  }, []);

  console.log('showContextCard', showContextCard);

  return (
    <div className="ai-copilot-container">
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
            </div>
          </>
        )}
      </div>
      <div
        className="ai-copilot-message-container"
        style={{ height: `calc(100vh - ${disable ? 16 : actualCopilotBodyHeight}px - 50px)` }}
      >
        <ChatMessages disable={disable} loading={isFetching} />
      </div>
      {!disable && (
        <div className="ai-copilot-body" style={{ height: actualCopilotBodyHeight }}>
          <div className="ai-copilot-body-inner-container">
            {showContextCard ? (
              <div className="ai-copilot-context-display">
                <ContextStateDisplay />
              </div>
            ) : null}
            <div className="ai-copilot-chat-container">
              <SkillDisplay />
              <div className="chat-input-container">
                <div className="chat-input-body">
                  <ChatInput placeholder="提出问题，发现新知" autoSize={{ minRows: 3, maxRows: 3 }} />
                </div>
                <div className="chat-input-assist-action">
                  <ContextContentWithBadge />
                  <CurrentContextActionBtn />
                  <SelectedTextContextActionBtn />
                  <OutputLocaleList>
                    <Button icon={<IconTranslate />} type="text" className="assist-action-item">
                      {/* <span>{localeToLanguageName?.[uiLocale]?.[outputLocale]} </span> */}
                      <IconCaretDown />
                    </Button>
                  </OutputLocaleList>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {knowledgeBaseStore?.convModalVisible ? <ConvListModal title="会话库" classNames="conv-list-modal" /> : null}
      {knowledgeBaseStore?.kbModalVisible && knowledgeBaseStore.actionSource === ActionSource.Conv ? (
        <KnowledgeBaseListModal title="知识库" classNames="kb-list-modal" />
      ) : null}
      {knowledgeBaseStore?.sourceListModalVisible ? (
        <SourceListModal
          title={`结果来源 (${knowledgeBaseStore?.tempConvResources?.length || 0})`}
          classNames="source-list-modal"
          resources={knowledgeBaseStore?.tempConvResources || []}
        />
      ) : null}

      {/** 注册 Skill 相关内容，目前先收敛在 Copilot 内部，后续允许挂在在其他扩展点，比如笔记、reading */}
      <RegisterSkillComponent />
      <SkillManagementModal />
    </div>
  );
};
