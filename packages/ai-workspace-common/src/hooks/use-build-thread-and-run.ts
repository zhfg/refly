import { Message as message } from '@arco-design/web-react';

import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useConversationStore } from '@refly-packages/ai-workspace-common/stores/conversation';
import { buildConversation } from '@refly-packages/ai-workspace-common/utils/conversation';
import { useResetState } from './use-reset-state';
import { useTaskStore } from '@refly-packages/ai-workspace-common/stores/task';
import { useLocation, useNavigate, useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';

// 类型
import { LOCALE } from '@refly/common-types';
import { Source, ChatMessage as Message, InvokeSkillRequest } from '@refly/openapi-schema';
import { SearchTarget, useSearchStateStore } from '@refly-packages/ai-workspace-common/stores/search-state';
import { useWeblinkStore } from '@refly-packages/ai-workspace-common/stores/weblink';
// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { useTranslation } from 'react-i18next';
import { OutputLocale } from '@refly-packages/ai-workspace-common/utils/i18n';
import { useBuildTask } from './use-build-task';
import { safeParseJSON } from '@refly-packages/ai-workspace-common/utils/parse';
import { useCopilotContextState } from './use-copilot-context-state';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';

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
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const { jumpToConv } = useKnowledgeBaseJumpNewPath();

  const emptyConvRunSkill = (question: string, forceNewConv?: boolean) => {
    // 首先清空所有状态
    if (forceNewConv) {
      resetState();
    }

    const newConv = ensureConversationExist(forceNewConv);
    console.log('emptyConvTask', newConv);
    conversationStore.setCurrentConversation(newConv);
    conversationStore.setIsNewConversation(true);
    chatStore.setNewQAText(question);

    jumpToConv({
      convId: newConv?.convId,
    });
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

  const runSkill = (comingQuestion: string) => {
    // support ask follow up question
    const { messages = [] } = useChatStore.getState();
    const { selectedSkill } = useSkillStore.getState();

    const question = comingQuestion;
    const isFollowUpAsk = messages?.length > 0;

    const { searchTarget } = useSearchStateStore.getState();
    const { currentSelectedText, currentResource } = useKnowledgeBaseStore.getState();
    const { localSettings } = useUserStore.getState();

    // 创建新会话并跳转
    const conv = ensureConversationExist();

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
    const task: InvokeSkillRequest = {
      skillId: selectedSkill?.skillId,
      input: {
        query: question,
      },
      context: {
        collectionIds,
        resourceIds,
        locale: localSettings?.outputLocale || LOCALE.EN,
      },
      convId: conv?.convId || '',
      ...(isFollowUpAsk ? {} : { createConvParam: { ...conv } }),
    };
    taskStore.setTask(task);
    // 开始提问
    buildTaskAndGenReponse(task as InvokeSkillRequest);
    chatStore.setNewQAText('');
    knowledgeBaseStore.updateSelectedText('');
  };

  return {
    runSkill,
    emptyConvRunSkill,
    ensureConversationExist,
  };
};
