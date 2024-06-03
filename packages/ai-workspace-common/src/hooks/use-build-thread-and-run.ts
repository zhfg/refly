import { Message as message } from '@arco-design/web-react';

import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useConversationStore } from '@refly-packages/ai-workspace-common/stores/conversation';
import { buildConversation } from '@refly-packages/ai-workspace-common/utils/conversation';
import { useResetState } from './use-reset-state';
import { useTaskStore } from '@refly-packages/ai-workspace-common/stores/task';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

// 类型
import { LOCALE } from '@refly/constants';
import {
  QuickActionTaskPayload,
  ChatTask,
  ContentMeta,
  Source,
  Conversation,
  ChatMessage as Message,
} from '@refly/openapi-schema';
import { SearchTarget, useSearchStateStore } from '@refly-packages/ai-workspace-common/stores/search-state';
import { useWeblinkStore } from '@refly-packages/ai-workspace-common/stores/weblink';
// request
import client from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { useTranslation } from 'react-i18next';
import { OutputLocale } from '@refly-packages/ai-workspace-common/utils/i18n';
import { useBuildTask } from './use-build-task';
import { safeParseJSON } from '@refly-packages/ai-workspace-common/utils/parse';
import { useCopilotContextState } from './use-copilot-context-state';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';

export const useBuildThreadAndRun = () => {
  const chatStore = useChatStore();
  const conversationStore = useConversationStore();
  const { resetState } = useResetState();
  const taskStore = useTaskStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { buildTaskAndGenReponse } = useBuildTask();
  const { currentResource, currentKnowledgeBase } = useCopilotContextState();
  const [searchParams, setSearchParams] = useSearchParams();
  const knowledgeBaseStore = useKnowledgeBaseStore();

  const cm: ContentMeta = {
    topics: [],
  };
  console.log(cm);

  const jumpNewConvQuery = (convId: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('convId', convId);
    setSearchParams(newSearchParams);
    navigate(`/knowledge-base?${newSearchParams.toString()}`);
  };

  const jumpNewKnowledgeBase = (kbId: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('kbId', kbId);
    newSearchParams.delete('resId');
    setSearchParams(newSearchParams);
    navigate(`/knowledge-base?${newSearchParams.toString()}`);
  };

  const emptyConvRunTask = (question: string, forceNewConv?: boolean) => {
    // 首先情况所有状态
    resetState();

    const newConv = ensureConversationExist(forceNewConv);
    conversationStore.setCurrentConversation(newConv);
    chatStore.setIsNewConversation(true);
    chatStore.setNewQAText(question);

    jumpNewConvQuery(newConv?.convId);
  };

  const handleCreateNewConversation = async (task: ChatTask) => {
    /**
     * 1. 创建新 thread，设置状态
     * 2. 跳转到 thread 界面，进行第一个回复，展示 问题、sources、答案
     */
    const { localSettings } = useUserStore.getState();
    const question = chatStore.newQAText;
    const newConversationPayload = buildConversation();

    // 创建新会话
    const { data: res, error } = await client.createConversation({
      body: { ...newConversationPayload, locale: localSettings.outputLocale },
    });

    if (error || !res?.success) {
      message.error({
        content: t('hooks.useBuildThreadAndRun.status.createFailed'),
      });
      return;
    }

    console.log('createNewConversation', res);
    conversationStore.setCurrentConversation(res?.data as Conversation);

    // 清空之前的状态
    resetState();

    // 设置当前的任务类型及会话 id
    task.convId = res?.data?.convId;
    taskStore.setTask(task);

    // 更新新的 newQAText，for 新会话跳转使用
    chatStore.setNewQAText(question);
    chatStore.setIsNewConversation(true);
    navigate(`/thread/${res?.data?.convId}`);
  };

  const ensureConversationExist = (forceNewConv = false) => {
    const { currentConversation } = useConversationStore.getState();
    const { localSettings } = useUserStore.getState();

    if (!currentConversation?.convId || forceNewConv) {
      const newConv = buildConversation({
        locale: localSettings?.outputLocale as OutputLocale,
      });
      conversationStore.setCurrentConversation(newConv);

      return newConv;
    }

    return currentConversation;
  };

  const runChatTask = (comingQuestion?: string) => {
    // support ask follow up question
    let question = '';
    if (typeof comingQuestion === 'string' && comingQuestion) {
      question = comingQuestion;
    } else {
      const { newQAText } = useChatStore.getState();
      question = newQAText;
    }

    const { localSettings } = useUserStore.getState();
    const { selectedRow } = useWeblinkStore.getState();
    const { searchTarget } = useSearchStateStore.getState();

    let selectedWebLink: Source[] = [];

    if (searchTarget === SearchTarget.CurrentPage) {
      selectedWebLink = [
        {
          pageContent: '',
          metadata: {
            title: document?.title || '',
            source: location.href,
          },
          score: -1, // 手工构造
        },
      ];
    } else if (searchTarget === SearchTarget.SelectedPages) {
      selectedWebLink = selectedRow?.map((item) => ({
        pageContent: '',
        metadata: {
          title: item?.content?.originPageTitle || '',
          source: item?.content?.originPageUrl || '',
        },
        score: -1, // 手工构造
      }));
    }

    const conv = ensureConversationExist();
    const task: ChatTask = {
      taskType: 'chat',
      convId: conv?.convId || '',
      data: {
        question,
        filter: { weblinkList: selectedWebLink },
      },
      locale: localSettings.outputLocale,
    };

    // 创建新会话并跳转
    handleCreateNewConversation(task);
  };

  const runQuickActionTask = async (payload: QuickActionTaskPayload) => {
    const { localSettings } = useUserStore.getState();

    const conv = ensureConversationExist();
    const task: ChatTask = {
      taskType: 'quickAction',
      convId: conv?.convId || '',
      data: {
        question: t('hooks.useBuildThreadAndRun.task.summary.question'),
        actionType: 'summary',
        filter: payload?.filter,
        actionPrompt: t('hooks.useBuildThreadAndRun.task.summary.actionPrompt'),
      },
      locale: localSettings.outputLocale,
    };

    // 创建新会话并跳转
    handleCreateNewConversation(task);
  };

  const getSelectedWeblinkConfig = (
    messages: Message[] = [],
  ): {
    searchTarget: SearchTarget;
    filter: Source[];
  } => {
    // 这里是获取第一个，早期简化策略，因为一开始设置之后，后续设置就保留
    const lastHumanMessage = messages?.find((item) => item.type === 'human');

    return safeParseJSON(lastHumanMessage?.selectedWeblinkConfig);
  };

  const runTask = (comingQuestion?: string) => {
    // support ask follow up question
    let question = '';
    const isFollowUpAsk = !!comingQuestion;
    if (typeof comingQuestion === 'string' && comingQuestion) {
      question = comingQuestion;
    } else {
      const { newQAText } = useChatStore.getState();
      question = newQAText;
    }

    const { searchTarget } = useSearchStateStore.getState();
    const { currentSelectedText, currentResource } = useKnowledgeBaseStore.getState();
    const { localSettings } = useUserStore.getState();

    // 创建新会话并跳转
    const conv = ensureConversationExist();
    const { messages } = useChatStore.getState();

    let selectedWebLink: Source[] = [];
    let resourceIds: string[] = [];
    let collectionIds: string[] = [];

    if (searchTarget === SearchTarget.SelectedPages) {
      if (isFollowUpAsk) {
        const selectedWeblinkConfig = getSelectedWeblinkConfig(messages);
        // 选中多个资源
        if (selectedWeblinkConfig?.filter?.length > 0) {
          selectedWebLink = selectedWeblinkConfig?.filter;
        }
      } else {
        const { selectedRow } = useWeblinkStore.getState();
        selectedWebLink = selectedRow?.map((item) => ({
          pageContent: '',
          metadata: {
            title: item?.content?.originPageTitle || '',
            source: item?.content?.originPageUrl || '',
          },
          score: -1, // 手工构造
        }));
      }
    } else if (searchTarget === SearchTarget.CurrentPage) {
      // 如果有选中内容，直接使用选中的内容
      if (currentSelectedText) {
        selectedWebLink = [
          {
            pageContent: '',
            metadata: {
              title: currentResource?.title as string,
              source: currentResource?.data?.url as string,
            },
            score: -1, // 手工构造
            selections: [
              {
                type: 'text',
                xPath: '',
                content: currentSelectedText || '',
              },
            ],
          },
        ];
      } else {
        // 否则选中当前资源
        resourceIds = [currentResource?.resourceId || ''];
      }
    } else if (searchTarget === SearchTarget.CurrentKnowledgeBase) {
      collectionIds = [currentKnowledgeBase?.collectionId || ''];
    }

    // 设置当前的任务类型及会话 id
    const task: ChatTask = {
      taskType: searchTarget === SearchTarget.SearchEnhance ? 'searchEnhanceAsk' : 'chat',
      data: {
        question,
        filter: { weblinkList: selectedWebLink, resourceIds, collectionIds },
      },
      locale: localSettings?.outputLocale || LOCALE.EN,
      convId: conv?.convId || '',
      ...(conv?.messages?.length > 0 ? {} : { createConvParam: { ...conv } }),
    };
    taskStore.setTask(task);
    // 开始提问
    buildTaskAndGenReponse(task as ChatTask);
    chatStore.setNewQAText('');
    knowledgeBaseStore.updateSelectedText('');
  };

  return {
    handleCreateNewConversation,
    runQuickActionTask,
    runChatTask,
    runTask,
    emptyConvRunTask,
    ensureConversationExist,
    jumpNewConvQuery,
    jumpNewKnowledgeBase,
  };
};
