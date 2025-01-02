import { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { Button, Divider, Result, Skeleton } from 'antd';
import { useTranslation } from 'react-i18next';
import { useActionResultStoreShallow } from '@refly-packages/ai-workspace-common/stores/action-result';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { ActionResult } from '@refly/openapi-schema';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';

import { actionEmitter } from '@refly-packages/ai-workspace-common/events/action';
import { ActionStepCard } from './action-step';
import { convertContextToItems } from '@refly-packages/ai-workspace-common/utils/map-context-items';

import { PreviewChatInput } from './preview-chat-input';
import { SourceListModal } from '@refly-packages/ai-workspace-common/components/source-list/source-list-modal';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useDeleteNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-delete-node';
import { EditChatInput } from '@refly-packages/ai-workspace-common/components/canvas/node-preview/skill-response/edit-chat-input';
import { cn } from '@refly-packages/utils/cn';
import { useReactFlow } from '@xyflow/react';
import { useSetNodeData } from '@refly-packages/ai-workspace-common/hooks/canvas/use-set-node-data';

interface SkillResponseNodePreviewProps {
  node: CanvasNode;
  resultId: string;
}

const StepsList = memo(({ steps, result, title }: { steps: any[]; result: any; title: string }) => {
  return (
    <>
      {steps.map((step, index) => (
        <div key={index}>
          <Divider className="my-2" />
          <ActionStepCard
            result={result}
            step={step}
            stepStatus={result.status === 'executing' && index === steps?.length - 1 ? 'executing' : 'finish'}
            index={index + 1}
            query={title}
          />
        </div>
      ))}
    </>
  );
});

const SkillResponseNodePreviewComponent = ({ node, resultId }: SkillResponseNodePreviewProps) => {
  const { result, updateActionResult } = useActionResultStoreShallow((state) => ({
    result: state.resultMap[resultId],
    updateActionResult: state.updateActionResult,
  }));
  const knowledgeBaseStore = useKnowledgeBaseStore((state) => ({
    sourceListDrawerVisible: state.sourceListDrawer.visible,
  }));

  const { getNodes } = useReactFlow();
  const setNodeData = useSetNodeData();
  const deleteNode = useDeleteNode(node, 'skillResponse');

  const { t } = useTranslation();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchActionResult = async (resultId: string) => {
    setLoading(true);
    const { data, error } = await getClient().getActionResult({
      query: { resultId },
    });

    if (error || !data?.success) {
      return;
    }

    updateActionResult(resultId, data.data);
    setLoading(false);

    const remoteResult = data.data;
    const node = getNodes().find((node) => node.data?.entityId === resultId);
    if (node && remoteResult) {
      setNodeData(node.id, {
        title: remoteResult.title,
        metadata: {
          status: remoteResult.status,
          contentPreview: remoteResult.steps
            ?.map((s) => s.content)
            .filter(Boolean)
            .join('\n'),
        },
      });
    }
  };

  useEffect(() => {
    if (!result) {
      fetchActionResult(resultId);
    } else {
      setLoading(false);
    }
  }, [resultId]);

  const scrollToBottom = useCallback(
    (event: { resultId: string; payload: ActionResult }) => {
      if (event.resultId !== resultId || event.payload.status !== 'executing') {
        return;
      }

      const container = document.body.querySelector('.preview-container');
      if (container) {
        const { scrollHeight, clientHeight } = container;
        container.scroll({
          behavior: 'smooth',
          top: scrollHeight - clientHeight + 50,
        });
      }
    },
    [resultId],
  );

  useEffect(() => {
    actionEmitter.on('updateResult', scrollToBottom);
    return () => {
      actionEmitter.off('updateResult', scrollToBottom);
    };
  }, []);

  const { title, steps = [], context, history = [], actionMeta, modelInfo } = result ?? {};
  const contextItems = useMemo(() => (context ? convertContextToItems(context, history) : []), [context, history]);

  if (!result && !loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Result
          status="404"
          subTitle={t('canvas.skillResponse.resultNotFound')}
          extra={<Button onClick={() => deleteNode()}>{t('canvas.nodeActions.delete')}</Button>}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 p-4 h-full">
      {editMode ? (
        <EditChatInput
          resultId={resultId}
          contextItems={contextItems}
          query={title}
          actionMeta={actionMeta}
          modelInfo={modelInfo}
          setEditMode={setEditMode}
        />
      ) : (
        <PreviewChatInput
          readonly
          contextItems={contextItems}
          query={title}
          actionMeta={actionMeta}
          setEditMode={setEditMode}
        />
      )}

      <div
        className={cn('h-full', {
          'opacity-30': editMode,
          'pointer-events-none': editMode,
        })}
      >
        {steps.length === 0 && (result?.status === 'executing' || result?.status === 'waiting' || loading) && (
          <Skeleton active />
        )}
        <StepsList steps={steps} result={result} title={title} />
      </div>

      {knowledgeBaseStore?.sourceListDrawerVisible ? <SourceListModal classNames="source-list-modal" /> : null}
    </div>
  );
};

export const SkillResponseNodePreview = memo(SkillResponseNodePreviewComponent, (prevProps, nextProps) => {
  return prevProps.node.id === nextProps.node.id && prevProps.resultId === nextProps.resultId;
});
