import { Message as message } from '@arco-design/web-react';

import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useConversationStore } from '@refly-packages/ai-workspace-common/stores/conversation';
import { buildConversation } from '@refly-packages/ai-workspace-common/utils/conversation';
import { useResetState } from './use-reset-state';
import { useTaskStore } from '@refly-packages/ai-workspace-common/stores/task';
import { useLocation, useNavigate, useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';

// 类型
import { ContextPanelDomain, LOCALE } from '@refly/common-types';
import { Source, ChatMessage as Message, InvokeSkillRequest, SkillContext, SearchDomain } from '@refly/openapi-schema';
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
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useNoteStore } from '@refly-packages/ai-workspace-common/stores/note';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';

export const useBuildThreadAndRun = () => {
  const chatStore = useChatStore((state) => ({
    setNewQAText: state.setNewQAText,
  }));
  const skillStore = useSkillStore((state) => ({
    setSelectedSkillInstalce: state.setSelectedSkillInstalce,
  }));
  const conversationStore = useConversationStore((state) => ({
    setCurrentConversation: state.setCurrentConversation,
    setIsNewConversation: state.setIsNewConversation,
  }));
  const { resetState } = useResetState();
  const taskStore = useTaskStore((state) => ({
    setTask: state.setTask,
  }));
  const { buildTaskAndGenReponse, buildShutdownTaskAndGenResponse } = useBuildTask();
  // const knowledgeBaseStore = useKnowledgeBaseStore((state) => ({
  //   updateCurrentSelectedMark: state.updateCurrentSelectedMark,
  // }));
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

  // TODO: support content list
  const buildSkillContext = (): SkillContext => {
    const { localSettings } = useUserStore.getState();
    const {
      currentKnowledgeBase,
      currentResource,
      currentSelectedMark,
      enableMultiSelect,
      currentSelectedMarks = [],
    } = useKnowledgeBaseStore.getState();
    const { currentNote } = useNoteStore.getState();
    const { checkedKeys, selectedWeblinks } = useContextPanelStore.getState();
    const mapDomainEnvIds = {
      collection: currentKnowledgeBase?.collectionId || '',
      resource: currentResource?.resourceId || '',
      note: currentNote?.noteId || '',
    };

    // collections
    const getIds = (domain: ContextPanelDomain, checkedKeys: string[]) => {
      // for select collection context `collection-collection_1_${item?.id}`, get last item.id
      let ids: string[] = checkedKeys
        ?.filter((key: string = '') => {
          if (key?.startsWith(`${domain}-`)) {
            return true;
          }

          return false;
        })
        .map((key) => {
          const id = key?.split('_')?.slice(-1)?.[0];
          return id;
        });

      // for env context, just check `currentPage-currentKnowledgeBase` checked
      if (checkedKeys?.includes(`currentPage-${domain}`) && getRuntime() === 'web') {
        ids.push(mapDomainEnvIds?.[domain] || '');
      }

      return Array.from(new Set(ids?.filter((id) => !!id)));
    };

    const getUrls = (domain: ContextPanelDomain, checkedKeys: string[]) => {
      let ids: string[] = checkedKeys
        ?.filter((key: string = '') => {
          if (key?.startsWith(`${domain}-`)) {
            return true;
          }

          return false;
        })
        .map((key) => {
          const id = key?.split('_')?.slice(-1)?.[0];
          return id;
        });

      ids = Array.from(new Set(ids?.filter((id) => !!id)));
      const urls = selectedWeblinks
        ?.filter((item) => {
          const id = item?.key?.split('_')?.slice(-1)?.[0];
          return ids?.includes(id);
        })
        .map((item) => item?.metadata?.resourceMeta?.url);

      if (checkedKeys?.includes(`currentPage-resource`) && getRuntime() !== 'web') {
        urls.push(currentResource?.data?.url);
      }

      return Array.from(new Set(urls));
    };

    const getContentList = () => {
      let contentList = [];
      if (checkedKeys?.includes(`currentPage-resource`) && getRuntime() !== 'web') {
        contentList.push(currentResource?.content || '');
      }

      if (enableMultiSelect) {
        contentList = contentList.concat(currentSelectedMarks.map((item) => item?.data));
      } else {
        contentList.push(currentSelectedMark?.data);
      }

      return contentList;
    };

    let context: SkillContext = {
      locale: localSettings?.outputLocale || LOCALE.EN,
      contentList: getContentList(),
      collectionIds: getIds('collection', checkedKeys),
      resourceIds: getIds('resource', checkedKeys),
      noteIds: getIds('note', checkedKeys),
      urls: getUrls('weblink', checkedKeys),
    };

    return context;
  };

  const runSkill = (comingQuestion: string) => {
    // support ask follow up question
    const { messages = [] } = useChatStore.getState();
    const { selectedSkill } = useSkillStore.getState();

    const question = comingQuestion;
    const isFollowUpAsk = messages?.length > 0;

    // 创建新会话并跳转
    const conv = ensureConversationExist();
    const skillContext = buildSkillContext();

    // 设置当前的任务类型及会话 id
    const task: InvokeSkillRequest = {
      skillId: selectedSkill?.skillId,
      input: {
        query: question,
      },
      context: skillContext,
      convId: conv?.convId || '',
      ...(isFollowUpAsk ? {} : { createConvParam: { ...conv, title: question } }),
    };
    taskStore.setTask(task);
    // 开始提问
    buildTaskAndGenReponse(task as InvokeSkillRequest);
    chatStore.setNewQAText('');
    skillStore.setSelectedSkillInstalce(null);
    // knowledgeBaseStore.updateCurrentSelectedMark(null);
  };

  return {
    runSkill,
    emptyConvRunSkill,
    ensureConversationExist,
    buildShutdownTaskAndGenResponse,
  };
};
