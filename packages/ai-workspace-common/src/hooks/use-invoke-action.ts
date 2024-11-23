import { BaseResponse, InvokeSkillRequest } from '@refly/openapi-schema';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { ssePost } from '@refly-packages/ai-workspace-common/utils/sse-post';
import { SkillEvent, LOCALE } from '@refly/common-types';
import { getAuthTokenFromCookie } from '@refly-packages/ai-workspace-common/utils/request';
import { safeParseJSON } from '@refly-packages/ai-workspace-common/utils/parse';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { showErrorNotification } from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import {
  useActionResultStore,
  useActionResultStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/action-result';

export const useInvokeAction = () => {
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

  const invokeAction = (payload: InvokeSkillRequest) => {
    const { resultId } = payload;
    updateActionResult(resultId, {
      resultId,
      type: 'skill',
      actionMeta: {},
      content: '',
      invokeParam: payload,
    });

    const connectTo = [
      ...(payload.context?.resources ?? []).map((resource) => ({
        type: 'resource' as const,
        entityId: resource.resourceId,
      })),
      ...(payload.context?.documents ?? []).map((document) => ({
        type: 'document' as const,
        entityId: document.docId,
      })),
      ...(payload.resultHistory ?? []).map((result) => ({
        type: 'response' as const,
        entityId: result.resultId,
      })),
    ];
    addNode(
      {
        type: 'response',
        data: {
          title: payload.input.query,
          entityId: resultId,
        },
      },
      connectTo,
    );

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

  return { invokeAction, abortAction };
};
