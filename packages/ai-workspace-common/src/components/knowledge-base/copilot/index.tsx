import { Button } from '@arco-design/web-react';

// 自定义组件
import {
  IconCaretDown,
  IconFolder,
  IconHistory,
  IconMessage,
  IconPlusCircle,
  IconTranslate,
} from '@arco-design/web-react/icon';
// 自定义样式
import './index.scss';
// 自定义组件
import { SearchTargetSelector } from '@refly-packages/ai-workspace-common/components/search-target-selector';
import { useSearchParams } from 'react-router-dom';
import { SearchTarget, useSearchStateStore } from '@refly-packages/ai-workspace-common/stores/search-state';
import { ContextStateDisplay } from './context-state-display';
import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';
import { useEffect, useState } from 'react';
import { ChatInput } from './chat-input';
import { ChatMessages } from './chat-messages';
import { ConvListModal } from './conv-list-modal';
import { KnowledgeBaseListModal } from './knowledge-base-list-modal';

// requests
import client from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

// state
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useConversationStore } from '@refly-packages/ai-workspace-common/stores/conversation';
import { useResetState } from '@refly-packages/ai-workspace-common/hooks/use-reset-state';
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { delay } from '@refly-packages/ai-workspace-common/utils/delay';
import { ActionSource, useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
// utils
import { LOCALE } from '@refly/constants';
import { localeToLanguageName } from '@refly-packages/ai-workspace-common/utils/i18n';
import { OutputLocaleList } from '@refly-packages/ai-workspace-common/components/output-locale-list';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { SourceListModal } from '../../source-list/source-list-modal';
import { useResizeCopilot } from '../../../hooks/use-resize-copilot';

interface AICopilotProps {}

export const AICopilot = (props: AICopilotProps) => {
  const [searchParams] = useSearchParams();
  const [copilotBodyHeight, setCopilotBodyHeight] = useState(215 - 32);
  const userStore = useUserStore();
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const { contextCardHeight, showContextCard, showContextState, showSelectedTextContext } = useCopilotContextState();
  const chatStore = useChatStore();
  const conversationStore = useConversationStore();
  const [isFetching, setIsFetching] = useState(false);
  const { runTask } = useBuildThreadAndRun();
  const searchStateStore = useSearchStateStore();

  const convId = searchParams.get('convId');
  const { resetState } = useResetState();
  const actualCopilotBodyHeight = copilotBodyHeight + (showContextCard ? contextCardHeight : 0);

  const { t, i18n } = useTranslation();
  const uiLocale = i18n?.languages?.[0] as LOCALE;
  const outputLocale = userStore?.localSettings?.outputLocale;

  const handleSwitchSearchTarget = () => {
    if (showContextState) {
      searchStateStore.setSearchTarget(SearchTarget.CurrentPage);
    }
  };

  const handleNewTempConv = () => {
    conversationStore.resetState();
    chatStore.resetState();
  };

  const handleNewOpenConvList = () => {
    knowledgeBaseStore.updateConvModalVisible(true);
  };

  const handleGetThreadMessages = async (convId: string) => {
    // 异步操作
    const { data: res, error } = await client.getConversationDetail({
      path: {
        convId,
      },
    });

    if (error) {
      throw error;
    }

    console.log('getThreadMessages', res);

    // 清空之前的状态
    resetState();

    // 设置会话和消息
    if (res?.data) {
      conversationStore.setCurrentConversation(res?.data);
    }

    chatStore.setMessages(res.data.messages);
  };

  const handleConvTask = async (convId: string) => {
    try {
      setIsFetching(true);
      const { isNewConversation, newQAText } = useChatStore.getState();

      // 新会话，需要手动构建第一条消息
      if (isNewConversation && convId) {
        // 更换成基于 task 的消息模式，核心是基于 task 来处理
        runTask(newQAText);
      } else if (convId) {
        handleGetThreadMessages(convId);
      }
    } catch (err) {
      console.log('thread error');
    }

    await delay(1500);
    setIsFetching(false);
  };

  useEffect(() => {
    if (convId) {
      handleConvTask(convId);
    }

    return () => {
      chatStore.setMessages([]);
    };
  }, [convId]);
  useEffect(() => {
    handleSwitchSearchTarget();
  }, [showContextState]);
  useResizeCopilot({ containerSelector: 'ai-copilot-container' });

  return (
    <div className="ai-copilot-container">
      <div className="knowledge-base-detail-header">
        <div className="knowledge-base-detail-navigation-bar">
          <div className="conv-meta">
            <IconMessage style={{ color: 'rgba(0, 0, 0, .6)' }} />
            <p className="conv-title">{conversationStore?.currentConversation?.title || '新会话'}</p>
          </div>
        </div>
        <div className="knowledge-base-detail-menu">
          {/* <Button
            type="text"
            icon={<IconMore style={{ fontSize: 16 }} />}></Button> */}
        </div>
      </div>
      <div
        className="ai-copilot-message-container"
        style={{ height: `calc(100vh - ${actualCopilotBodyHeight}px - 50px)` }}
      >
        <ChatMessages />
      </div>
      <div className="ai-copilot-body" style={{ height: actualCopilotBodyHeight }}>
        {showContextCard ? (
          <div className="ai-copilot-context-display">
            <ContextStateDisplay />
          </div>
        ) : null}
        <div className="ai-copilot-chat-container">
          <div className="chat-setting-container">
            <div className="chat-operation-container">
              <Button
                icon={<IconFolder />}
                type="text"
                onClick={() => {
                  knowledgeBaseStore.updateActionSource(ActionSource.Conv);
                  knowledgeBaseStore.updateKbModalVisible(true);
                }}
                className="chat-input-assist-action-item"
              >
                选择知识库
                <IconCaretDown />
              </Button>
            </div>
            <div className="conv-operation-container">
              <Button
                icon={<IconHistory />}
                type="text"
                onClick={() => {
                  handleNewOpenConvList();
                }}
                className="chat-input-assist-action-item"
              >
                会话历史
              </Button>
              <Button
                icon={<IconPlusCircle />}
                type="text"
                onClick={() => {
                  handleNewTempConv();
                }}
                className="chat-input-assist-action-item"
              >
                新会话
              </Button>
            </div>
          </div>

          {/* <div className="skill-container">
            {["搜索", "写作", "翻译", "数据分析", "更多技能"].map(
              (item, index) => (
                <div key={index} className="skill-item">
                  {item}
                </div>
              ),
            )}
          </div> */}
          <div className="chat-input-container">
            <div className="chat-input-body">
              <ChatInput placeholder="提出问题，发现新知" autoSize={{ minRows: 3, maxRows: 3 }} />
            </div>
            <div className="chat-input-assist-action">
              {!showSelectedTextContext ? <SearchTargetSelector classNames="chat-input-assist-action-item" /> : null}

              <OutputLocaleList>
                <Button icon={<IconTranslate />} type="text" className="chat-input-assist-action-item">
                  <span>{localeToLanguageName?.[uiLocale]?.[outputLocale]} </span>
                  <IconCaretDown />
                </Button>
              </OutputLocaleList>
            </div>
          </div>
        </div>
      </div>
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
    </div>
  );
};
