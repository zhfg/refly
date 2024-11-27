import { ActionResult, BaseResponse, CanvasNodeData, InvokeSkillRequest } from '@refly/openapi-schema';
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
import { actionEmitter } from '@refly-packages/ai-workspace-common/events/action';

export const useInvokeAction = () => {
  const { addNode } = useCanvasControl();
  const updateActionResult = useActionResultStoreShallow((state) => state.updateActionResult);

  const globalAbortControllerRef = { current: null as AbortController | null };
  const globalIsAbortedRef = { current: false as boolean };

  const onUpdateResult = (resultId: string, payload: ActionResult) => {
    actionEmitter.emit('updateResult', { resultId, payload });
    updateActionResult(resultId, payload);
  };

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
    onUpdateResult(skillEvent.resultId, updatedResult);
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
    onUpdateResult(skillEvent.resultId, updatedResult);
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
    onUpdateResult(skillEvent.resultId, updatedResult);
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
    onUpdateResult(skillEvent.resultId, updatedResult);
  };

  const onSkillArtifact = (skillEvent: SkillEvent) => {
    const { resultId, artifact } = skillEvent;
    const { resultMap } = useActionResultStore.getState();
    const result = resultMap[resultId];

    if (!result) {
      return;
    }

    const existingArtifacts = Array.isArray(result.artifacts) ? [...result.artifacts] : [];

    const artifactIndex = existingArtifacts.findIndex((item) => item?.entityId === artifact?.entityId);

    const updatedArtifacts =
      artifactIndex !== -1
        ? existingArtifacts.map((item, index) => (index === artifactIndex ? artifact : item))
        : [...existingArtifacts, artifact];

    const updatedResult = {
      ...result,
      artifacts: updatedArtifacts,
    };

    onUpdateResult(skillEvent.resultId, updatedResult);
  };

  const onSkillCreateNode = (skillEvent: SkillEvent) => {
    const { node, resultId } = skillEvent;
    addNode(
      {
        type: node.type,
        data: node.data as CanvasNodeData,
      },
      [
        {
          type: 'skillResponse',
          entityId: resultId,
        },
      ],
    );
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
    onUpdateResult(skillEvent.resultId, updatedResult);
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
    const { resultId, input } = payload;
    onUpdateResult(resultId, {
      resultId,
      type: 'skill',
      actionMeta: {},
      content: '',
      title: input?.query,
      invokeParam: payload,
      logs: [],
      status: 'waiting',
      artifacts: [],
      structuredData: {},
      tokenUsage: [],
      errors: [],
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
        type: 'skillResponse' as const,
        entityId: result.resultId,
      })),
    ];
    addNode(
      {
        type: 'skillResponse',
        data: {
          title: input?.query,
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
      onSkillArtifact,
      onSkillStructedData,
      onSkillCreateNode,
      onSkillEnd,
      onCompleted,
      onError,
      onSkillUsage,
    });
  };

  return { invokeAction, abortAction };
};
