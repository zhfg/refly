import {
  MessageIntentContext,
  useChatStore,
  useChatStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/chat';
import {
  useConversationStore,
  useConversationStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/conversation';
import { buildConversation, getConversation } from '@refly-packages/ai-workspace-common/utils/conversation';
import { notification } from 'antd';
import { useResetState } from './use-reset-state';
import { useTaskStoreShallow } from '@refly-packages/ai-workspace-common/stores/task';
import { ConfigScope, InvokeSkillRequest, SkillContext, SkillTemplateConfig } from '@refly/openapi-schema';
import { useUserStore, useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import { OutputLocale } from '@refly-packages/ai-workspace-common/utils/i18n';
import { useBuildTask } from './use-build-task';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { useJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { useBuildSkillContext } from './use-build-skill-context';
import { useTranslation } from 'react-i18next';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useContextFilterErrorTip } from '@refly-packages/ai-workspace-common/components/copilot/copilot-operation-module/context-manager/hooks/use-context-filter-errror-tip';
import { useSearchStoreShallow } from '@refly-packages/ai-workspace-common/stores/search';

interface InvokeParams {
  skillContext?: SkillContext;
  tplConfig?: SkillTemplateConfig;
  messageIntentContext?: MessageIntentContext;
  userInput?: string; // 用户输入
}

export const useBuildThreadAndRun = () => {
  const { t } = useTranslation();
  const { buildSkillContext } = useBuildSkillContext();
  const chatStore = useChatStoreShallow((state) => ({
    setNewQAText: state.setNewQAText,
    setInvokeParams: state.setInvokeParams,
    setMessageIntentContext: state.setMessageIntentContext,
  }));
  const { setLoginModalVisible, isLogin } = useUserStoreShallow((state) => ({
    setLoginModalVisible: state.setLoginModalVisible,
    isLogin: state.isLogin,
  }));

  const conversationStore = useConversationStoreShallow((state) => ({
    currentConversation: state.currentConversation,
    setCurrentConversation: state.setCurrentConversation,
  }));
  const setIsSearchOpen = useSearchStoreShallow((state) => state.setIsSearchOpen);
  const { resetState } = useResetState();
  const taskStore = useTaskStoreShallow((state) => ({
    setTask: state.setTask,
  }));
  const { buildTaskAndGenReponse, buildShutdownTaskAndGenResponse } = useBuildTask();
  const { jumpToConv } = useJumpNewPath();
  const { handleFilterErrorTip } = useContextFilterErrorTip();

  // TODO: temp not need this function
  const emptyConvRunSkill = (
    question: string,
    forceNewConv?: boolean,
    invokeParams?: { projectId?: string; skillContext?: SkillContext; tplConfig?: SkillTemplateConfig },
  ) => {
    if (forceNewConv) {
      resetState();
    }

    const { messageIntentContext } = useChatStore.getState();

    const newConv = ensureConversationExist(invokeParams?.projectId, forceNewConv);
    conversationStore.setCurrentConversation(newConv);
    chatStore.setNewQAText(question);
    chatStore.setInvokeParams(invokeParams);

    jumpToConv({
      convId: newConv?.convId,
      projectId: newConv?.projectId,
      state: {
        navigationContext: {
          shouldFetchDetail: false,
          source: messageIntentContext?.env?.source,
        },
      },
    });
  };

  // TODO: 这里考虑针对 homePage 来的会话请求，需要清除 conv，重新处理
  const ensureConversationExist = (projectId?: string, forceNewConv = false) => {
    const { currentConversation } = useConversationStore.getState();
    const { localSettings } = useUserStore.getState();

    if (!currentConversation?.convId || forceNewConv) {
      const newConv = buildConversation({
        projectId,
        locale: localSettings?.outputLocale as OutputLocale,
      });
      conversationStore.setCurrentConversation(newConv);

      return newConv;
    }

    return currentConversation;
  };

  const runSkill = (comingQuestion: string, invokeParams?: InvokeParams) => {
    // support ask follow up question
    const { messages = [], selectedModel, messageIntentContext } = useChatStore.getState();
    const { selectedSkill } = useSkillStore.getState();
    const { localSettings } = useUserStore.getState();

    let question = comingQuestion.trim();
    const canvasEditConfig = messageIntentContext?.canvasEditConfig;
    const projectId = messageIntentContext?.projectContext?.projectId;
    const canvasId = messageIntentContext?.canvasContext?.canvasId;
    const forceNewConv = messageIntentContext?.isNewConversation;
    const enableWebSearch = messageIntentContext?.enableWebSearch;
    const enableKnowledgeBaseSearch = messageIntentContext?.enableKnowledgeBaseSearch;
    const enableDeepReasonWebSearch = messageIntentContext?.enableDeepReasonWebSearch;

    // const conv = ensureConversationExist(projectId, forceNewConv);
    const skillContext = invokeParams?.skillContext || buildSkillContext();

    // set convId info to messageIntentContext
    const newMessageIntentContext: Partial<MessageIntentContext> = {
      ...(messageIntentContext || {}),
      // convId: conv?.convId,
    };

    if (forceNewConv) {
      resetState();
    }

    chatStore.setMessageIntentContext(newMessageIntentContext as MessageIntentContext);

    // TODO: temp make scheduler support
    const tplConfig = !!selectedSkill?.skillId
      ? invokeParams?.tplConfig
      : {
          enableWebSearch: {
            value: enableWebSearch,
            configScope: 'runtime' as unknown as ConfigScope,
            displayValue: t('copilot.webSearch.title'),
            label: t('copilot.webSearch.title'),
          },
          enableKnowledgeBaseSearch: {
            value: enableKnowledgeBaseSearch,
            configScope: 'runtime' as unknown as ConfigScope,
            displayValue: t('copilot.knowledgeBaseSearch.title'),
            label: t('copilot.knowledgeBaseSearch.title'),
          },
          enableDeepReasonWebSearch: {
            value: enableDeepReasonWebSearch,
            configScope: 'runtime' as unknown as ConfigScope,
            displayValue: t('copilot.deepReasonWebSearch.title'),
            label: t('copilot.deepReasonWebSearch.title'),
          },
          ...(canvasEditConfig
            ? {
                canvasEditConfig: {
                  value: canvasEditConfig as { [key: string]: unknown },
                  configScope: 'runtime' as unknown as ConfigScope,
                  displayValue: localSettings?.uiLocale === 'zh-CN' ? '编辑稿布配置' : 'Edit Canvas Config',
                  label: localSettings?.uiLocale === 'zh-CN' ? '编辑稿布配置' : 'Edit Canvas Config',
                },
              }
            : {}),
        };

    question =
      question ||
      (selectedSkill
        ? t('copilot.chatInput.defaultQuestion', { name: selectedSkill?.displayName })
        : t('copilot.chatInput.chatWithReflyAssistant'));

    const task: InvokeSkillRequest = {
      skillId: selectedSkill?.skillId,
      projectId,
      canvasId,
      input: {
        query: question,
      },
      modelName: selectedModel?.name,
      context: skillContext,
      skillName: 'common_qna', // TODO: allow select skill
      locale: localSettings?.outputLocale as OutputLocale,
      tplConfig,
    };
    taskStore.setTask(task);

    // Start asking
    buildTaskAndGenReponse(task);
  };

  const sendChatMessage = (params: InvokeParams) => {
    if (!isLogin) {
      setLoginModalVisible(true);
      return;
    }

    const error = handleFilterErrorTip();
    if (error) {
      return;
    }

    const { formErrors } = useContextPanelStore.getState();
    if (formErrors && Object.keys(formErrors).length > 0) {
      notification.error({
        message: t('copilot.configManager.errorTipTitle'),
        description: t('copilot.configManager.errorTip'),
      });
      return;
    }

    const { newQAText } = useChatStore.getState();

    setIsSearchOpen(false);
    runSkill(params.userInput || newQAText, params); // jump extra handler in useHandleAICanvas
  };

  return {
    runSkill,
    sendChatMessage,
    emptyConvRunSkill,
    ensureConversationExist,
    buildShutdownTaskAndGenResponse,
  };
};
