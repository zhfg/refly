import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useConversationStore } from '@refly-packages/ai-workspace-common/stores/conversation';
import { buildConversation } from '@refly-packages/ai-workspace-common/utils/conversation';
import { useResetState } from './use-reset-state';
import { useTaskStore } from '@refly-packages/ai-workspace-common/stores/task';

// 类型
import {
  Source,
  ChatMessage as Message,
  InvokeSkillRequest,
  SkillContext,
  SearchDomain,
  SkillTemplateConfig,
} from '@refly/openapi-schema';
// request
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { OutputLocale } from '@refly-packages/ai-workspace-common/utils/i18n';
import { useBuildTask } from './use-build-task';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
// hooks
import { useBuildSkillContext } from './use-build-skill-context';

export const useBuildThreadAndRun = () => {
  const { buildSkillContext } = useBuildSkillContext();
  const chatStore = useChatStore((state) => ({
    setNewQAText: state.setNewQAText,
    setInvokeParams: state.setInvokeParams,
  }));
  const skillStore = useSkillStore((state) => ({
    setSelectedSkillInstance: state.setSelectedSkillInstance,
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

  const emptyConvRunSkill = (
    question: string,
    forceNewConv?: boolean,
    invokeParams?: { skillContext?: SkillContext; tplConfig?: SkillTemplateConfig },
  ) => {
    // 首先清空所有状态
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

  const runSkill = (
    comingQuestion: string,
    invokeParams?: { skillContext?: SkillContext; tplConfig?: SkillTemplateConfig },
  ) => {
    // support ask follow up question
    const { messages = [], selectedModel } = useChatStore.getState();
    const { selectedSkill } = useSkillStore.getState();
    const { localSettings } = useUserStore.getState();

    const question = comingQuestion;
    const isFollowUpAsk = messages?.length > 0;

    // 创建新会话并跳转
    const conv = ensureConversationExist();
    const skillContext = invokeParams?.skillContext || buildSkillContext();

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
      tplConfig: invokeParams?.tplConfig,
      ...{ createConvParam: { ...conv, title: question } },
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
