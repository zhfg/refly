import { useCallback, useRef } from 'react';
import { ActionResult, ActionStep, ActionStepMeta, Entity, SkillEvent } from '@refly/openapi-schema';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { ssePost } from '@refly-packages/ai-workspace-common/utils/sse-post';
import { LOCALE } from '@refly/common-types';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { useAddNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-add-node';
import { useSetNodeDataByEntity } from '@refly-packages/ai-workspace-common/hooks/canvas/use-set-node-data-by-entity';
import { showErrorNotification } from '@refly-packages/ai-workspace-common/utils/notification';
import {
  useActionResultStore,
  useActionResultStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/action-result';
import { actionEmitter } from '@refly-packages/ai-workspace-common/events/action';
import { aggregateTokenUsage, genActionResultID } from '@refly-packages/utils/index';
import {
  CanvasNodeData,
  ResponseNodeMeta,
  SkillNodeMeta,
} from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { useGetSubscriptionUsage } from '@refly-packages/ai-workspace-common/queries';
import { convertContextItemsToInvokeParams } from '@refly-packages/ai-workspace-common/utils/map-context-items';
import { useFindThreadHistory } from '@refly-packages/ai-workspace-common/hooks/canvas/use-find-thread-history';
import { useActionPolling } from './use-action-polling';

export const useInvokeAction = () => {
  const { addNode } = useAddNode();
  const setNodeDataByEntity = useSetNodeDataByEntity();
  const { updateActionResult } = useActionResultStoreShallow((state) => ({
    updateActionResult: state.updateActionResult,
  }));

  const globalAbortControllerRef = { current: null as AbortController | null };
  const globalIsAbortedRef = { current: false as boolean };

  const { refetch: refetchTokenUsage } = useGetSubscriptionUsage({}, [], {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const { createTimeoutHandler } = useActionPolling();

  const onUpdateResult = (resultId: string, payload: ActionResult, event?: SkillEvent) => {
    actionEmitter.emit('updateResult', { resultId, payload });
    updateActionResult(resultId, payload);

    // Update canvas node data
    if (payload.targetType === 'canvas') {
      const { title, steps = [] } = payload ?? {};
      const nodeData: Partial<CanvasNodeData<ResponseNodeMeta>> = {
        title,
        entityId: resultId,
        metadata: {
          status: payload.status,
          actionMeta: payload.actionMeta,
          modelInfo: payload.modelInfo,
          version: event?.version ?? payload.version,
        },
      };

      const { event: eventType, log } = event ?? {};

      if (eventType === 'stream') {
        nodeData.contentPreview = steps
          .map((s) => s.content)
          ?.filter(Boolean)
          ?.join('\n');
      } else if (eventType === 'artifact') {
        nodeData.metadata = {
          status: payload.status,
          artifacts: steps.flatMap((s) => s.artifacts),
        };
      } else if (eventType === 'log') {
        nodeData.metadata = {
          status: payload.status,
          currentLog: log,
        };
      } else if (eventType === 'structured_data') {
        const structuredData = steps.reduce((acc, step) => ({ ...acc, ...step.structuredData }), {});
        nodeData.metadata = {
          status: payload.status,
          structuredData: structuredData,
        };
      } else if (eventType === 'token_usage') {
        nodeData.metadata = {
          status: payload.status,
          tokenUsage: aggregateTokenUsage(steps.flatMap((s) => s.tokenUsage).filter(Boolean)),
        };
      }

      setNodeDataByEntity<ResponseNodeMeta>({ type: 'skillResponse', entityId: resultId }, nodeData);
    }
  };

  const onSkillStart = (skillEvent: SkillEvent) => {};

  const onSkillLog = (skillEvent: SkillEvent) => {
    const { resultId, step, log } = skillEvent;
    const { resultMap } = useActionResultStore.getState();
    const result = resultMap[resultId];

    if (!result || !step) {
      return;
    }

    const updatedStep: ActionStep = findOrCreateStep(result.steps ?? [], step);
    updatedStep.logs = [...(updatedStep.logs || []), log];

    const updatedResult = {
      ...result,
      status: 'executing' as const,
      steps: getUpdatedSteps(result.steps ?? [], updatedStep),
    };
    onUpdateResult(skillEvent.resultId, updatedResult, skillEvent);
  };

  const onSkillTokenUsage = (skillEvent: SkillEvent) => {
    const { resultId, step, tokenUsage } = skillEvent;
    const { resultMap } = useActionResultStore.getState();
    const result = resultMap[resultId];

    if (!result || !step) {
      return;
    }

    const updatedStep: ActionStep = findOrCreateStep(result.steps ?? [], step);
    updatedStep.tokenUsage = aggregateTokenUsage([...(updatedStep.tokenUsage ?? []), tokenUsage]);

    onUpdateResult(
      resultId,
      {
        ...result,
        steps: getUpdatedSteps(result.steps ?? [], updatedStep),
      },
      skillEvent,
    );
  };

  const findOrCreateStep = (steps: ActionStep[], stepMeta: ActionStepMeta) => {
    const existingStep = steps?.find((s) => s.name === stepMeta?.name);
    return existingStep
      ? { ...existingStep }
      : {
          ...stepMeta,
          content: '',
          artifacts: [],
          structuredData: {},
        };
  };

  const getUpdatedSteps = (steps: ActionStep[], updatedStep: ActionStep) => {
    if (!steps?.find((step) => step.name === updatedStep.name)) {
      return [...steps, updatedStep];
    }
    return steps.map((step) => (step.name === updatedStep.name ? updatedStep : step));
  };

  const onSkillStream = (skillEvent: SkillEvent) => {
    const { resultId, content, step } = skillEvent;
    const { resultMap } = useActionResultStore.getState();
    const result = resultMap[resultId];

    if (!result || !step) {
      return;
    }

    const updatedStep: ActionStep = findOrCreateStep(result.steps ?? [], step);
    updatedStep.content += content;

    onUpdateResult(
      resultId,
      {
        ...result,
        status: 'executing' as const,
        steps: getUpdatedSteps(result.steps ?? [], updatedStep),
      },
      skillEvent,
    );
  };

  const onSkillStructedData = (skillEvent: SkillEvent) => {
    const { step, resultId, structuredData = {} } = skillEvent;
    const { resultMap } = useActionResultStore.getState();
    const result = resultMap[resultId];

    if (!result || !structuredData || !step) {
      return;
    }

    const updatedStep: ActionStep = findOrCreateStep(result.steps ?? [], step);
    updatedStep.structuredData = {
      ...updatedStep.structuredData,
      ...structuredData,
    };

    const updatedResult = {
      ...result,
      status: 'executing' as const,
      steps: getUpdatedSteps(result.steps ?? [], updatedStep),
    };
    onUpdateResult(skillEvent.resultId, updatedResult, skillEvent);
  };

  const onSkillArtifact = (skillEvent: SkillEvent) => {
    const { resultId, artifact, step } = skillEvent;
    const { resultMap } = useActionResultStore.getState();
    const result = resultMap[resultId];

    if (!result || !step) {
      return;
    }

    const updatedStep: ActionStep = findOrCreateStep(result.steps ?? [], step);
    const existingArtifacts = Array.isArray(updatedStep.artifacts) ? [...updatedStep.artifacts] : [];
    const artifactIndex = existingArtifacts.findIndex((item) => item?.entityId === artifact?.entityId);

    updatedStep.artifacts =
      artifactIndex !== -1
        ? existingArtifacts.map((item, index) => (index === artifactIndex ? artifact : item))
        : [...existingArtifacts, artifact];

    const updatedResult = {
      ...result,
      status: 'executing' as const,
      steps: getUpdatedSteps(result.steps ?? [], updatedStep),
    };

    onUpdateResult(skillEvent.resultId, updatedResult, skillEvent);
  };

  const onSkillCreateNode = (skillEvent: SkillEvent) => {
    const { node, resultId } = skillEvent;
    addNode(
      {
        type: node.type,
        data: {
          ...node.data,
          metadata: {
            status: 'executing',
            ...node.data?.metadata,
          },
        } as CanvasNodeData,
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
    onUpdateResult(skillEvent.resultId, updatedResult, skillEvent);

    const artifacts = result.steps?.flatMap((s) => s.artifacts);
    if (artifacts?.length) {
      artifacts.forEach((artifact) => {
        setNodeDataByEntity(
          {
            type: artifact.type,
            entityId: artifact.entityId,
          },
          {
            metadata: {
              status: 'finish',
            },
          },
        );
      });
    }

    setTimeout(() => refetchTokenUsage(), 2000);
  };

  const onSkillError = (skillEvent: SkillEvent) => {
    const runtime = getRuntime();
    const { localSettings } = useUserStore.getState();
    const locale = localSettings?.uiLocale as LOCALE;

    const { error, resultId } = skillEvent;
    showErrorNotification(error, locale);

    const { resultMap } = useActionResultStore.getState();
    const result = resultMap[resultId];

    if (!result) {
      return;
    }

    const updatedResult = {
      ...result,
      status: 'failed' as const,
      errors: [error?.errMsg],
    };
    onUpdateResult(skillEvent.resultId, updatedResult, skillEvent);

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

  const abortAction = useCallback(
    (msg?: string) => {
      try {
        globalAbortControllerRef.current?.abort();
        globalIsAbortedRef.current = true;
      } catch (err) {
        console.log('shutdown error', err);
      }
    },
    [globalAbortControllerRef, globalIsAbortedRef],
  );

  const onCompleted = () => {};
  const onStart = () => {};
  const findThreadHistory = useFindThreadHistory();

  const invokeAction = (payload: SkillNodeMeta, target: Entity) => {
    payload.resultId ||= genActionResultID();
    payload.selectedSkill ||= { name: 'commonQnA' };

    const { query, modelInfo, contextItems, selectedSkill, resultId, version = 0 } = payload;
    const { context, resultHistory } = convertContextItemsToInvokeParams(contextItems, (item) =>
      findThreadHistory({ resultId: item.entityId }).map((node) => ({
        title: node.data?.title,
        resultId: node.data?.entityId,
      })),
    );

    const param = {
      resultId,
      input: {
        query,
      },
      target,
      modelName: modelInfo?.name,
      context,
      resultHistory,
      skillName: selectedSkill?.name,
    };

    onUpdateResult(resultId, {
      resultId,
      version,
      type: 'skill',
      actionMeta: selectedSkill,
      modelInfo,
      title: query,
      targetId: target?.entityId,
      targetType: target?.entityType,
      context,
      history: resultHistory,
      tplConfig: {},
      status: 'waiting',
      steps: [],
      errors: [],
    });

    globalAbortControllerRef.current = new AbortController();

    // Create timeout handler for this action
    const { resetTimeout, cleanup } = createTimeoutHandler(resultId, version);

    // Wrap event handlers to reset timeout
    const wrapEventHandler =
      (handler: Function) =>
      (...args: any[]) => {
        resetTimeout();
        handler(...args);
      };

    resetTimeout();

    ssePost({
      controller: globalAbortControllerRef.current,
      payload: param,
      onStart: wrapEventHandler(onStart),
      onSkillStart: wrapEventHandler(onSkillStart),
      onSkillStream: wrapEventHandler(onSkillStream),
      onSkillLog: wrapEventHandler(onSkillLog),
      onSkillArtifact: wrapEventHandler(onSkillArtifact),
      onSkillStructedData: wrapEventHandler(onSkillStructedData),
      onSkillCreateNode: wrapEventHandler(onSkillCreateNode),
      onSkillEnd: wrapEventHandler(onSkillEnd),
      onCompleted: wrapEventHandler(onCompleted),
      onSkillError: wrapEventHandler(onSkillError),
      onSkillTokenUsage: wrapEventHandler(onSkillTokenUsage),
    });

    return cleanup;
  };

  return { invokeAction, abortAction };
};
