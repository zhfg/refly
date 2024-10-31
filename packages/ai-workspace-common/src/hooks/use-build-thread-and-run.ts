import {
  ChatMode,
  MessageIntentContext,
  useChatStore,
  useChatStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/chat';
import {
  useConversationStore,
  useConversationStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/conversation';
import { buildConversation, getConversation } from '@refly-packages/ai-workspace-common/utils/conversation';
import { Notification } from '@arco-design/web-react';
import { useResetState } from './use-reset-state';
import { useTaskStoreShallow } from '@refly-packages/ai-workspace-common/stores/task';

import { ConfigScope, InvokeSkillRequest, SkillContext, SkillTemplateConfig } from '@refly/openapi-schema';
// request
import { useUserStore, useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import { OutputLocale } from '@refly-packages/ai-workspace-common/utils/i18n';
import { useBuildTask } from './use-build-task';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { useJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
// hooks
import { useBuildSkillContext } from './use-build-skill-context';
import { useTranslation } from 'react-i18next';
import { useHandleRecents } from '@refly-packages/ai-workspace-common/hooks/use-handle-rencents';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useContextFilterErrorTip } from '@refly-packages/ai-workspace-common/components/copilot/copilot-operation-module/context-manager/hooks/use-context-filter-errror-tip';
import { useSearchStoreShallow } from '@refly-packages/ai-workspace-common/stores/search';

interface InvokeParams {
  chatMode?: ChatMode;
  skillContext?: SkillContext;
  tplConfig?: SkillTemplateConfig;
  messageIntentContext?: MessageIntentContext;
  userInput?: string; // 用户输入
}

export const useBuildThreadAndRun = () => {
  const { t } = useTranslation();
  const { buildSkillContext } = useBuildSkillContext();
  const chatStore = useChatStoreShallow((state) => ({
    setChatMode: state.setChatMode,
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
  const { addRecentConversation } = useHandleRecents();
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
          source: messageIntentContext?.source,
        },
      },
    });

    addRecentConversation(newConv);
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
    const { messages = [], selectedModel, enableWebSearch, messageIntentContext } = useChatStore.getState();
    const { selectedSkill } = useSkillStore.getState();
    const { localSettings } = useUserStore.getState();

    let question = comingQuestion.trim();
    const canvasEditConfig = messageIntentContext?.canvasEditConfig;
    const projectId = messageIntentContext?.projectContext?.projectId;
    const forceNewConv = messageIntentContext?.isNewConversation;

    // 创建新会话并跳转
    const conv = ensureConversationExist(projectId, forceNewConv);
    const skillContext = invokeParams?.skillContext || buildSkillContext();
    const chatMode = messageIntentContext?.chatMode;

    // set convId info to messageIntentContext
    const newMessageIntentContext: Partial<MessageIntentContext> = {
      ...(messageIntentContext || {}),
      convId: conv?.convId,
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
            displayValue: localSettings?.uiLocale === 'zh-CN' ? '全网搜索' : 'Web Search',
            label: localSettings?.uiLocale === 'zh-CN' ? '全网搜索' : 'Web Search',
          },
          chatMode: {
            value: chatMode,
            configScope: 'runtime' as unknown as ConfigScope,
            displayValue: localSettings?.uiLocale === 'zh-CN' ? '提问模式' : 'Normal Chat',
            label: localSettings?.uiLocale === 'zh-CN' ? '直接提问' : 'Normal Chat',
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

    // 设置当前的任务类型及会话 id
    const task: InvokeSkillRequest = {
      skillId: selectedSkill?.skillId,
      projectId,
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
    // chatStore.setNewQAText('');
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
      Notification.error({
        style: { width: 400 },
        title: t('copilot.configManager.errorTipTitle'),
        content: t('copilot.configManager.errorTip'),
      });
      return;
    }

    if (params.chatMode) {
      chatStore.setChatMode(params.chatMode);
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
