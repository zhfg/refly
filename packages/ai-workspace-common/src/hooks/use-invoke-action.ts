import { useTranslation } from 'react-i18next';
import { notification } from 'antd';
import {
  BaseResponse,
  ConfigScope,
  InvokeSkillRequest,
  SkillContext,
  SkillTemplateConfig,
} from '@refly/openapi-schema';
import { useUserStore, useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import { OutputLocale } from '@refly-packages/ai-workspace-common/utils/i18n';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { ssePost } from '@refly-packages/ai-workspace-common/utils/sse-post';
import { useBuildSkillContext } from './use-build-skill-context';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useContextFilterErrorTip } from '@refly-packages/ai-workspace-common/components/copilot/copilot-operation-module/context-manager/hooks/use-context-filter-errror-tip';
import { SkillEvent, LOCALE } from '@refly/common-types';
import { getAuthTokenFromCookie } from '@refly-packages/ai-workspace-common/utils/request';
import { safeParseJSON } from '@refly-packages/ai-workspace-common/utils/parse';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { showErrorNotification } from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import {
  MessageIntentContext,
  useChatStore,
  useChatStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/chat';
import {
  useActionResultStore,
  useActionResultStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/action-result';
import { genActionResultID } from '@refly-packages/utils/id';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';

interface InvokeParams {
  skillContext?: SkillContext;
  tplConfig?: SkillTemplateConfig;
  messageIntentContext?: MessageIntentContext;
  userInput?: string; // 用户输入
}

export const useInvokeAction = () => {
  const { t } = useTranslation();
  const { buildSkillContext } = useBuildSkillContext();

  const { setLoginModalVisible, isLogin } = useUserStoreShallow((state) => ({
    setLoginModalVisible: state.setLoginModalVisible,
    isLogin: state.isLogin,
  }));

  const { handleFilterErrorTip } = useContextFilterErrorTip();
  const chatStore = useChatStoreShallow((state) => ({
    setNewQAText: state.setNewQAText,
  }));

  const { addNode } = useCanvasControl();
  const updateActionResult = useActionResultStoreShallow((state) => state.updateActionResult);

  const globalAbortControllerRef = { current: null as AbortController | null };
  const globalIsAbortedRef = { current: false as boolean };

  const onSkillStart = (skillEvent: SkillEvent) => {};

  const onSkillLog = (skillEvent: SkillEvent) => {
    const { resultMap } = useActionResultStore.getState();
    const result = resultMap[skillEvent.resultId];

    if (!result) {
      return;
    }

    const updatedResult = {
      ...result,
      logs: [...(result.logs || []), skillEvent.content],
    };
    updateActionResult(skillEvent.resultId, updatedResult);
  };

  const onSkillUsage = (skillEvent: SkillEvent) => {
    const { resultMap } = useActionResultStore.getState();
    const result = resultMap[skillEvent.resultId];

    if (!result) {
      return;
    }

    const tokenUsage = safeParseJSON(skillEvent.content);
    if (!tokenUsage?.token.length) {
      return;
    }

    const updatedResult = {
      ...result,
      tokenUsage: tokenUsage.token,
    };
    updateActionResult(skillEvent.resultId, updatedResult);
  };

  const onSkillStream = (skillEvent: SkillEvent) => {
    const { resultMap } = useActionResultStore.getState();
    const result = resultMap[skillEvent.resultId];

    if (!result) {
      return;
    }

    const updatedResult = {
      ...result,
      status: 'executing' as const,
      content: result.content + skillEvent.content,
    };
    updateActionResult(skillEvent.resultId, updatedResult);
  };

  const onSkillStructedData = (skillEvent: SkillEvent) => {
    const { resultMap } = useActionResultStore.getState();
    const result = resultMap[skillEvent.resultId];

    if (!result) {
      return;
    }

    const structuredData = safeParseJSON(skillEvent?.content);
    if (!structuredData) {
      return;
    }

    const updatedResult = {
      ...result,
      structuredData: { ...result.structuredData, ...structuredData },
    };
    updateActionResult(skillEvent.resultId, updatedResult);
  };

  const onSkillEnd = (skillEvent: SkillEvent) => {
    const { resultMap } = useActionResultStore.getState();
    const result = resultMap[skillEvent.resultId];

    if (!result) {
      return;
    }

    const updatedResult = {
      ...result,
      status: 'finish' as const,
    };
    updateActionResult(skillEvent.resultId, updatedResult);
  };

  const onError = (error?: BaseResponse) => {
    console.log('onError', error);
    const runtime = getRuntime();
    const { localSettings } = useUserStore.getState();
    const locale = localSettings?.uiLocale as LOCALE;

    error ??= { success: false };
    showErrorNotification(error, locale);

    if (runtime?.includes('extension')) {
      if (globalIsAbortedRef.current) {
        return;
      }
    } else {
      // if it is aborted, do nothing
      if (globalAbortControllerRef.current?.signal?.aborted) {
        return;
      }
    }

    abortAction(error?.errMsg);
  };

  const abortAction = (msg?: string) => {
    try {
      globalAbortControllerRef.current?.abort();
      globalIsAbortedRef.current = true;
    } catch (err) {
      console.log('shutdown error', err);
    }
  };

  const onCompleted = () => {};

  const onStart = () => {};

  const handleSendSSERequest = (payload: InvokeSkillRequest) => {
    globalAbortControllerRef.current = new AbortController();

    ssePost({
      controller: globalAbortControllerRef.current,
      payload,
      token: getAuthTokenFromCookie(),
      onStart,
      onSkillStart,
      onSkillStream,
      onSkillLog,
      onSkillStructedData,
      onSkillEnd,
      onCompleted,
      onError,
      onSkillUsage,
    });
  };

  const runSkill = (comingQuestion: string, invokeParams?: InvokeParams) => {
    // support ask follow up question
    const { selectedModel, messageIntentContext } = useChatStore.getState();
    const { selectedSkill } = useSkillStore.getState();
    const { localSettings } = useUserStore.getState();

    let question = comingQuestion.trim();
    const canvasEditConfig = messageIntentContext?.canvasEditConfig;
    const projectId = messageIntentContext?.projectContext?.projectId;
    const canvasId = messageIntentContext?.canvasContext?.canvasId;
    const enableWebSearch = messageIntentContext?.enableWebSearch;
    const enableKnowledgeBaseSearch = messageIntentContext?.enableKnowledgeBaseSearch;
    const enableDeepReasonWebSearch = messageIntentContext?.enableDeepReasonWebSearch;

    const skillContext = invokeParams?.skillContext || buildSkillContext();

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

    const resultId = genActionResultID();
    const invokeParam: InvokeSkillRequest = {
      skillId: selectedSkill?.skillId,
      projectId,
      canvasId,
      resultId,
      input: {
        query: question,
      },
      modelName: selectedModel?.name,
      context: skillContext,
      skillName: 'common_qna', // TODO: allow select skill
      locale: localSettings?.outputLocale as OutputLocale,
      tplConfig,
    };

    updateActionResult(resultId, {
      resultId,
      type: 'skill',
      actionMeta: {},
      content: '',
      invokeParam,
    });

    addNode({
      type: 'response',
      data: {
        entityId: resultId,
      },
    });

    chatStore.setNewQAText('');

    // Start asking
    handleSendSSERequest(invokeParam);
  };

  const invokeAction = (params: InvokeParams) => {
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

    runSkill(params.userInput || newQAText, params);
  };

  return { invokeAction, abortAction };
};
