import { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { Divider, Skeleton } from 'antd';
import { useActionResultStoreShallow } from '@refly-packages/ai-workspace-common/stores/action-result';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { ActionResult } from '@refly/openapi-schema';

import { actionEmitter } from '@refly-packages/ai-workspace-common/events/action';
import { ActionStepCard } from './action-step';
import { convertContextToItems } from '@refly-packages/ai-workspace-common/utils/map-context-items';

import { PreviewChatInput } from './preview-chat-input';

import './index.scss';
import { SourceListModal } from '@refly-packages/ai-workspace-common/components/source-list/source-list-modal';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';

interface SkillResponseNodePreviewProps {
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

const SkillResponseNodePreviewComponent = ({ resultId }: SkillResponseNodePreviewProps) => {
  const { result, updateActionResult } = useActionResultStoreShallow((state) => ({
    result: state.resultMap[resultId],
    updateActionResult: state.updateActionResult,
  }));
  const knowledgeBaseStore = useKnowledgeBaseStore((state) => ({
    sourceListDrawerVisible: state.sourceListDrawer.visible,
  }));

  console.log('SkillResponseNodePreview', result);

  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
  };

  useEffect(() => {
    if (!result) {
      fetchActionResult(resultId);
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

  const { title, steps = [], context, history = [], actionMeta } = result ?? {};
  const contextItems = useMemo(() => (context ? convertContextToItems(context) : []), [context]);

  const historyItems = useMemo(
    () =>
      history?.map((item) => ({
        id: item.resultId,
        position: { x: 0, y: 0 },
        data: {
          entityId: item.resultId,
          contentPreview: item.steps?.map((step) => step.content)?.join('\n\n'),
          title: item.title,
          metadata: {
            steps: item.steps,
          },
        },
      })) || [],
    [history],
  );

  return (
    <div className="flex flex-col space-y-4 p-4">
      <div className="ai-copilot-operation-container readonly">
        <div className="ai-copilot-operation-body">
          {result && (
            <PreviewChatInput
              readonly
              contextItems={contextItems}
              historyItems={historyItems}
              chatHistoryOpen={chatHistoryOpen}
              setChatHistoryOpen={setChatHistoryOpen}
              query={title}
              actionMeta={actionMeta}
            />
          )}
        </div>
      </div>

      {steps.length === 0 && (result?.status === 'executing' || loading) && <Skeleton active />}

      <StepsList steps={steps} result={result} title={title} />

      {knowledgeBaseStore?.sourceListDrawerVisible ? <SourceListModal classNames="source-list-modal" /> : null}
    </div>
  );
};

export const SkillResponseNodePreview = memo(SkillResponseNodePreviewComponent, (prevProps, nextProps) => {
  return prevProps.resultId === nextProps.resultId;
});
