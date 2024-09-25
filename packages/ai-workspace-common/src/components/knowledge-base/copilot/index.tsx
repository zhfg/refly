import { Button, Checkbox } from '@arco-design/web-react';

// 自定义组件
import { IconClose, IconEdit, IconFile, IconHistory, IconPlusCircle, IconSearch } from '@arco-design/web-react/icon';
// 自定义样式
import './index.scss';
// 自定义组件
import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { useSearchStateStore } from '@refly-packages/ai-workspace-common/stores/search-state';
import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';
import { memo, useEffect, useState } from 'react';
import { ChatMessages } from './chat-messages';
import { ConvListModal } from './conv-list-modal';
import { KnowledgeBaseListModal } from './knowledge-base-list-modal';
import { SkillManagementModal } from '@refly-packages/ai-workspace-common/components/skill/skill-management-modal';
import { CopilotOperationModule } from './copilot-operation-module';
import { CopilotChatHeader } from './chat-header';

// state
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useConversationStore } from '@refly-packages/ai-workspace-common/stores/conversation';
import { useResetState } from '@refly-packages/ai-workspace-common/hooks/use-reset-state';
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { ActionSource } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useKnowledgeBaseStore } from '../../../stores/knowledge-base';
// utils
import { LOCALE } from '@refly/common-types';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { SourceListModal } from '@refly-packages/ai-workspace-common/components/source-list/source-list-modal';
import { useResizeCopilot } from '@refly-packages/ai-workspace-common/hooks/use-resize-copilot';
import { useMessageStateStore } from '@refly-packages/ai-workspace-common/stores/message-state';
import { RegisterSkillComponent } from '@refly-packages/ai-workspace-common/skills/main-logic/register-skill-component';
import classNames from 'classnames';
import { useAINote } from '@refly-packages/ai-workspace-common/hooks/use-ai-note';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { useSearchStore } from '@refly-packages/ai-workspace-common/stores/search';
import { useNoteStore } from '@refly-packages/ai-workspace-common/stores/note';
import { useDynamicInitContextPanelState } from '@refly-packages/ai-workspace-common/hooks/use-init-context-panel-state';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';

interface AICopilotProps {
  disable?: boolean;
  source?: string;
  jobId?: string;
}

const skillContainerPadding = 8;
const skillContainerHeight = 24 + 2 * skillContainerPadding;
// const selectedSkillContainerHeight = 32;
const inputContainerHeight = 115;
const chatContainerPadding = 8;
const layoutContainerPadding = 16;
const selectedSkillContainerHeight = 270 + 32 + 2 * chatContainerPadding;
const knowledgeBaseDetailHeaderHeight = 40;

export const AICopilot = memo((props: AICopilotProps) => {
  // 所属的环境
  const runtime = getRuntime();
  const isWeb = runtime === 'web';

  const [searchParams] = useSearchParams();
  const userStore = useUserStore((state) => ({
    localSettings: state.localSettings,
  }));
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
  const contextPanelStore = useContextPanelStore((state) => ({
    setShowContextCard: state.setShowContextCard,
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
  const { contextCardHeight, computedShowContextCard, showContextState } = useCopilotContextState();
  const chatStore = useChatStore((state) => ({
    messages: state.messages,
    resetState: state.resetState,
    setMessages: state.setMessages,
    setInvokeParams: state.setInvokeParams,
  }));
  const conversationStore = useConversationStore((state) => ({
    isNewConversation: state.isNewConversation,
    currentConversation: state.currentConversation,
    resetState: state.resetState,
    setCurrentConversation: state.setCurrentConversation,
    setIsNewConversation: state.setIsNewConversation,
  }));
  const [isFetching, setIsFetching] = useState(false);
  const { runSkill } = useBuildThreadAndRun();
  const searchStateStore = useSearchStateStore((state) => ({
    searchTarget: state.searchTarget,
  }));
  const messageStateStore = useMessageStateStore((state) => ({
    pending: state.pending,
    pendingFirstToken: state.pendingFirstToken,
    resetState: state.resetState,
  }));
  const skillStore = useSkillStore((state) => ({
    selectedSkill: state.selectedSkill,
    setSelectedSkillInstance: state.setSelectedSkillInstance,
  }));

  console.log('useKnowledgeBaseStore state update from packages', knowledgeBaseStore.resourcePanelVisible);

  const convId = searchParams.get('convId');
  const noteId = searchParams.get('noteId');
  const resId = searchParams.get('resId');
  const { resetState } = useResetState();

  const actualChatContainerHeight = inputContainerHeight;

  const actualOperationContainerHeight =
    (skillStore.selectedSkill
      ? selectedSkillContainerHeight
      : actualChatContainerHeight + skillContainerHeight + 2 * chatContainerPadding) +
    (computedShowContextCard ? contextCardHeight : 0);

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
      const { newQAText, invokeParams } = useChatStore.getState();
      const { isNewConversation } = useConversationStore.getState();

      // 新会话，需要手动构建第一条消息
      if (isNewConversation && convId) {
        // 更换成基于 task 的消息模式，核心是基于 task 来处理
        runSkill(newQAText, invokeParams);
      } else if (convId) {
        handleGetThreadMessages(convId);
      }
    } catch (err) {
      console.log('thread error');
    }

    setIsFetching(false);

    // reset state
    conversationStore.setIsNewConversation(false);
    chatStore.setInvokeParams({});
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
  useResizeCopilot({ containerSelector: 'ai-copilot-container' });
  useDynamicInitContextPanelState(); // 动态根据页面状态更新上下文面板状态

  useEffect(() => {
    const runtime = getRuntime();

    if (runtime === 'web') {
      contextPanelStore.setShowContextCard(false);
    }
  }, []);

  console.log('computedShowContextCard', computedShowContextCard);

  return (
    <div className="ai-copilot-container">
      <CopilotChatHeader />
      <div className="ai-copilot-body-container">
        <div
          className="ai-copilot-message-container"
          style={{ height: `calc(100% - ${disable ? 0 : actualOperationContainerHeight}px)` }}
        >
          <ChatMessages disable={disable} loading={isFetching} />
        </div>
        {!disable && (
          <CopilotOperationModule
            source={source}
            chatContainerHeight={actualChatContainerHeight}
            operationContainerHeight={actualOperationContainerHeight}
          />
        )}
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

      {/** 注册 Skill 相关内容，目前先收敛在 Copilot 内部，后续允许挂在在其他扩展点，比如笔记、reading */}
      <RegisterSkillComponent />
      <SkillManagementModal />
    </div>
  );
});
