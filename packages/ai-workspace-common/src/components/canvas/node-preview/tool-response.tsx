import { useEffect } from 'react';
import { useActionResultStoreShallow } from '@refly-packages/ai-workspace-common/stores/action-result';
import { useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { HumanMessage, AssistantMessage } from '../../copilot/message';
import { ChatMessage } from '@refly/openapi-schema';
// import './skill-response.scss';

interface ToolResponseNodePreviewProps {
  resultId: string;
}

export const ToolResponseNodePreview = ({ resultId }: ToolResponseNodePreviewProps) => {
  const userProfile = useUserStoreShallow((state) => state.userProfile);
  const { result, updateActionResult } = useActionResultStoreShallow((state) => ({
    result: state.resultMap[resultId],
    updateActionResult: state.updateActionResult,
  }));

  const fetchActionResult = async (resultId: string) => {
    const { data, error } = await getClient().getActionResult({
      query: { resultId },
    });

    if (error || !data?.success) {
      return;
    }

    updateActionResult(resultId, data.data);
  };

  useEffect(() => {
    if (!result) {
      fetchActionResult(resultId);
    }
  }, [resultId]);

  if (!result) {
    return <div className="flex h-full items-center justify-center text-gray-500">Loading response data...</div>;
  }

  const humanMessage: Partial<ChatMessage> = {
    msgId: `${resultId}-human`,
    type: 'human',
    content: result.invokeParam?.input?.query ?? '',
    invokeParam: {
      context: result.invokeParam?.context,
    },
  };

  const assistantMessage: Partial<ChatMessage> = {
    msgId: `${resultId}-assistant`,
    type: 'ai',
    content: result.content ?? '',
    skillMeta: {
      displayName: result.actionMeta?.name ?? 'AI Response',
      icon: result.actionMeta?.icon,
    },
    tokenUsage: result.tokenUsage,
    structuredData: result.structuredData,
  };

  return (
    <div className="ai-copilot-message-container">
      {/* Human Message */}
      {humanMessage.content && (
        <HumanMessage
          message={humanMessage}
          profile={{
            avatar: userProfile?.avatar ?? '',
            name: userProfile?.nickname ?? 'User',
          }}
          disable={true}
        />
      )}

      {/* AI Response */}
      {assistantMessage.content && (
        <AssistantMessage
          message={assistantMessage}
          humanMessage={humanMessage}
          disable={false}
          isLastSession={true}
          isPendingFirstToken={false}
          isPending={false}
        />
      )}
    </div>
  );
};
