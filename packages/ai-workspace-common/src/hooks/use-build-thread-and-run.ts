import { useChatStore, useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';
import { useConversationStoreShallow } from '@refly-packages/ai-workspace-common/stores/conversation';
import { buildConversation, getConversation } from '@refly-packages/ai-workspace-common/utils/conversation';
import { useResetState } from './use-reset-state';
import { useTaskStoreShallow } from '@refly-packages/ai-workspace-common/stores/task';

import { InvokeSkillRequest, SkillContext, SkillTemplateConfig } from '@refly/openapi-schema';
// request
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { OutputLocale } from '@refly-packages/ai-workspace-common/utils/i18n';
import { useBuildTask } from './use-build-task';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
// hooks
import { useBuildSkillContext } from './use-build-skill-context';
import { useTranslation } from 'react-i18next';

export const useBuildThreadAndRun = () => {
  const { t } = useTranslation();
  const { buildSkillContext } = useBuildSkillContext();
  const chatStore = useChatStoreShallow((state) => ({
    setNewQAText: state.setNewQAText,
    setInvokeParams: state.setInvokeParams,
  }));
  const conversationStore = useConversationStoreShallow((state) => ({
    currentConversation: state.currentConversation,
    setCurrentConversation: state.setCurrentConversation,
    setIsNewConversation: state.setIsNewConversation,
  }));
  const { resetState } = useResetState();
  const taskStore = useTaskStoreShallow((state) => ({
    setTask: state.setTask,
  }));
  const { buildTaskAndGenReponse, buildShutdownTaskAndGenResponse } = useBuildTask();
  const { jumpToConv } = useKnowledgeBaseJumpNewPath();

  const emptyConvRunSkill = (
    question: string,
    forceNewConv?: boolean,
    invokeParams?: { skillContext?: SkillContext; tplConfig?: SkillTemplateConfig },
  ) => {
    if (forceNewConv) {
      resetState();
    }

    const newConv = ensureConversationExist(forceNewConv);
    console.log('emptyConvTask', newConv);
    conversationStore.setCurrentConversation(newConv);
    conversationStore.setIsNewConversation(true);
    chatStore.setNewQAText(question);
    chatStore.setInvokeParams(invokeParams);

    jumpToConv({
      convId: newConv?.convId,
      projectId: newConv?.projectId, // TODO: conv 增加 projectId
    });
  };

  const ensureConversationExist = (forceNewConv = false) => {
    const { currentConversation } = conversationStore;
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

  const runSkill = (
    comingQuestion: string,
    invokeParams?: { skillContext?: SkillContext; tplConfig?: SkillTemplateConfig },
  ) => {
    // support ask follow up question
    const { messages = [], selectedModel, enableWebSearch, chatMode } = useChatStore.getState();
    const { selectedSkill } = useSkillStore.getState();
    const { localSettings } = useUserStore.getState();

    let question = comingQuestion.trim();
    const isFollowUpAsk = messages?.length > 0;

    // 创建新会话并跳转
    const conv = ensureConversationExist();
    const skillContext = invokeParams?.skillContext || buildSkillContext();

    // TODO: temp make scheduler support
    const tplConfig = !!selectedSkill?.skillId
      ? invokeParams?.tplConfig
      : {
          enableWebSearch: {
            value: enableWebSearch,
            configScope: ['runtime'],
            displayValue: localSettings?.uiLocale === 'zh-CN' ? '联网搜索' : 'Web Search',
            label: localSettings?.uiLocale === 'zh-CN' ? '联网搜索' : 'Web Search',
          },
          chatMode: {
            value: chatMode,
            configScope: ['runtime'],
            displayValue: localSettings?.uiLocale === 'zh-CN' ? '提问模式' : 'Normal Chat',
            label: localSettings?.uiLocale === 'zh-CN' ? '直接提问' : 'Normal Chat',
          },
        };

    question =
      question ||
      (selectedSkill
        ? t('copilot.chatInput.defaultQuestion', { name: selectedSkill?.displayName })
        : t('copilot.chatInput.chatWithReflyAssistant'));

    // 设置当前的任务类型及会话 id
    const task: InvokeSkillRequest = {
      skillId: selectedSkill?.skillId,
      input: {
        query: question,
      },
      modelName: selectedModel?.name,
      context: skillContext,
      convId: conv?.convId || '',
      locale: localSettings?.outputLocale as OutputLocale,
      tplConfig,
      ...{ createConvParam: getConversation({ ...conv, title: question }) },
    };
    taskStore.setTask(task);
    // 开始提问
    buildTaskAndGenReponse(task as InvokeSkillRequest);
    chatStore.setNewQAText('');
    // skillStore.setSelectedSkillInstance(null);
    // knowledgeBaseStore.updateCurrentSelectedMark(null);
  };

  return {
    runSkill,
    emptyConvRunSkill,
    ensureConversationExist,
    buildShutdownTaskAndGenResponse,
  };
};
