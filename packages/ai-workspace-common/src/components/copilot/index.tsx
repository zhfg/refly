import { memo, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatMessages } from './chat-messages';
import { ConvListModal } from './conv-list-modal';
import { SkillManagementModal } from '@refly-packages/ai-workspace-common/components/skill/skill-management-modal';
import { CopilotOperationModule } from './copilot-operation-module';
import { CopilotChatHeader } from './chat-header';
import { useLocation, useParams, useSearchParams, useNavigate } from 'react-router-dom';

// state
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useConversationStore } from '@refly-packages/ai-workspace-common/stores/conversation';
import { useResetState } from '@refly-packages/ai-workspace-common/hooks/use-reset-state';
import { useKnowledgeBaseStore } from '../../stores/knowledge-base';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { SourceListModal } from '@refly-packages/ai-workspace-common/components/source-list/source-list-modal';
import { useDynamicInitContextPanelState } from '@refly-packages/ai-workspace-common/hooks/use-init-context-panel-state';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useMessageStateStore } from '@refly-packages/ai-workspace-common/stores/message-state';
// types
import { MessageIntentSource, NavigationContext } from '@refly-packages/ai-workspace-common/types/copilot';

import './index.scss';
import {
  useNavigationContextStore,
  useNavigationContextStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/navigation-context';

interface AICopilotProps {
  disable?: boolean;
  source: MessageIntentSource;
  jobId?: string;
}

export const AICopilot = memo((props: AICopilotProps) => {
  const { t } = useTranslation();
  const { disable, jobId, source } = props;
  const navigate = useNavigate();
  const setNavigationContext = useNavigationContextStoreShallow((state) => state.setNavigationContext);

  const [searchParams] = useSearchParams();
  const queryConvId = searchParams.get('convId');
  const { convId: pathConvId } = useParams();
  const convId = queryConvId || pathConvId;
  const runtime = getRuntime();
  const isWeb = runtime === 'web';

  const location = useLocation();

  const knowledgeBaseStore = useKnowledgeBaseStore((state) => ({
    resourcePanelVisible: state.resourcePanelVisible,
    kbModalVisible: state.kbModalVisible,
    actionSource: state.actionSource,
    updateConvModalVisible: state.updateConvModalVisible,
    updateResourcePanelVisible: state.updateResourcePanelVisible,
    currentKnowledgeBase: state.currentKnowledgeBase,
    convModalVisible: state.convModalVisible,
    sourceListDrawerVisible: state.sourceListDrawer.visible,
  }));

  const contextPanelStore = useContextPanelStore((state) => ({
    setShowContextCard: state.setShowContextCard,
  }));

  const chatStore = useChatStore((state) => ({
    messages: state.messages,
    resetState: state.resetState,
    setMessages: state.setMessages,
    setInvokeParams: state.setInvokeParams,
  }));
  const messageStateStore = useMessageStateStore((state) => ({
    resetState: state.resetState,
  }));

  const conversationStore = useConversationStore((state) => ({
    currentConversation: state.currentConversation,
    resetState: state.resetState,
    setCurrentConversation: state.setCurrentConversation,
  }));

  const [isFetching, setIsFetching] = useState(false);

  const { resetState } = useResetState();

  const copilotOperationModuleRef = useRef<HTMLDivElement>(null);
  const [operationModuleHeight, setOperationModuleHeight] = useState(0);

  const updateOperationModuleHeight = useCallback(() => {
    if (copilotOperationModuleRef.current) {
      setOperationModuleHeight(copilotOperationModuleRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    updateOperationModuleHeight();

    const resizeObserver = new ResizeObserver(updateOperationModuleHeight);
    if (copilotOperationModuleRef.current) {
      resizeObserver.observe(copilotOperationModuleRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateOperationModuleHeight]);

  const handleGetThreadMessages = async (convId: string) => {
    const { data: res, error } = await getClient().getConversationDetail({
      path: {
        convId,
      },
    });

    if (error) {
      throw error;
    }

    resetState();

    if (res?.data) {
      conversationStore.setCurrentConversation(res?.data);
    }

    chatStore.setMessages(res.data.messages);
  };

  const getThreadMessagesByJobId = async (jobId: string) => {
    setIsFetching(true);

    const { data: res, error } = await getClient().getSkillJobDetail({
      query: {
        jobId,
      },
    });

    if (error) {
      throw error;
    }

    resetState();

    setIsFetching(false);
    chatStore.setMessages(res?.data?.messages || []);
  };

  const clearNavigationState = useCallback(() => {
    // 只清空 state，保持当前 URL 不变
    navigate(location.pathname + location.search, {
      replace: true, // 替换当前历史记录
      state: {}, // 清空 state
    });
  }, [location]);

  const handleConvTask = async (convId: string, jobId?: string) => {
    const navigationContext = useNavigationContextStore.getState().navigationContext;
    const { shouldFetchDetail } = navigationContext || {};
    if (navigationContext && !shouldFetchDetail) {
      setNavigationContext(undefined);
      return;
    }

    try {
      setIsFetching(true);
      if (convId && convId !== 'new' && source !== MessageIntentSource.SkillJob) {
        await handleGetThreadMessages(convId);
      } else if (jobId && convId !== 'new' && source === MessageIntentSource.SkillJob) {
        await getThreadMessagesByJobId(jobId);
      } else if (!convId && !jobId) {
        conversationStore.resetState();
        chatStore.resetState();
        messageStateStore.resetState();
      }
    } catch (err) {
      console.log('thread error');
    }

    setIsFetching(false);

    chatStore.setInvokeParams({});
    setNavigationContext(undefined);
  };

  useEffect(() => {
    handleConvTask(convId, jobId);

    return () => {
      // chatStore.setMessages([]);
    };
  }, [convId, jobId]);

  useDynamicInitContextPanelState(); // 动态根据页面状态更新上下文面板状态

  useEffect(() => {
    const runtime = getRuntime();

    if (runtime === 'web') {
      contextPanelStore.setShowContextCard(false);
    }
  }, []);

  return (
    <div className="ai-copilot-container">
      <CopilotChatHeader source={source} />
      <div className="ai-copilot-body-container">
        <div
          className="ai-copilot-message-container"
          style={{ height: `calc(100% - ${disable ? 0 : operationModuleHeight}px)` }}
        >
          <ChatMessages disable={disable} loading={isFetching} />
        </div>
        {!disable && <CopilotOperationModule ref={copilotOperationModuleRef} source={source} />}
      </div>

      {knowledgeBaseStore?.convModalVisible ? (
        <ConvListModal source={source} title={t('copilot.convListModal.title')} classNames="conv-list-modal" />
      ) : null}
      {knowledgeBaseStore?.sourceListDrawerVisible && !isWeb ? (
        <SourceListModal classNames="source-list-modal" />
      ) : null}

      <SkillManagementModal />
    </div>
  );
});
