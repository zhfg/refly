import { useEffect } from 'react';
import { Divider, Typography, Steps } from 'antd';
import { useActionResultStoreShallow } from '@refly-packages/ai-workspace-common/stores/action-result';
import { useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { HumanMessage, AssistantMessage } from '../../copilot/message';
import { Artifact, ChatMessage } from '@refly/openapi-schema';
import { FileText, Sparkles } from 'lucide-react';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';
import './skill-response.scss';
import { IconCheckCircle, IconLoading } from '@arco-design/web-react/icon';
import { cn } from '@refly-packages/utils/cn';

interface SkillResponseNodePreviewProps {
  resultId: string;
}

const getArtifactIcon = (artifact: Artifact) => {
  switch (artifact.type) {
    case 'document':
      return <FileText className="w-4 h-4" />;
    default:
      return <Sparkles className="w-4 h-4" />;
  }
};

export const SkillResponseNodePreview = ({ resultId }: SkillResponseNodePreviewProps) => {
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
    return (
      <div className="flex flex-col w-full space-y-2 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
            <span className="text-gray-600">处理中</span>
            <span className="text-gray-400 text-sm">20.18 ms</span>
          </div>
        ))}
      </div>
    );
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
    msgId: resultId,
    type: 'ai',
    content: result.content ?? '',
    skillMeta: {
      displayName: result.actionMeta?.name ?? 'AI Response',
      icon: result.actionMeta?.icon,
    },
    tokenUsage: result.tokenUsage,
    structuredData: result.structuredData,
  };
  const description = 'This is a description.';

  return (
    <div className="flex flex-col space-y-4 p-4">
      <div className="text-xl font-medium">生成长文</div>

      <div className="ai-copilot-message-container">
        {humanMessage?.content && (
          <HumanMessage
            message={humanMessage}
            profile={{
              avatar: userProfile?.avatar ?? '',
              name: userProfile?.nickname ?? 'User',
            }}
            disable={true}
          />
        )}
      </div>

      <div className="m-2 p-4 pb-0 border border-solid border-gray-200 rounded-lg">
        <Steps
          direction="vertical"
          current={result.logs?.length ?? 0}
          size="small"
          items={result.logs?.map((log, index) => ({
            title: log,
            description,
          }))}
        />
      </div>

      <div className="m-2 text-gray-600 text-base">
        <Markdown content={result.content} />
      </div>

      <div>
        {result.artifacts?.map((artifact) => (
          <div
            className="border border-solid border-gray-200 rounded-lg m-2 px-4 py-2 h-12 flex items-center justify-between space-x-2 cursor-pointer hover:bg-gray-50"
            onClick={() => {
              console.log('artifact clicked', artifact);
            }}
          >
            <div className="flex items-center space-x-2">
              {getArtifactIcon(artifact)}
              <span className="text-gray-600 max-w-[200px] truncate inline-block">{artifact.title}</span>
            </div>
            <div
              className={cn('flex items-center space-x-1 text-xs', {
                'text-yellow-500': artifact.status === 'generating',
                'text-green-500': artifact.status === 'finish',
              })}
            >
              {artifact.status === 'generating' && (
                <>
                  <IconLoading />
                  <span>Generating</span>
                </>
              )}
              {artifact.status === 'finish' && (
                <>
                  <IconCheckCircle />
                  <span>Completed</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <Divider />

      <div className="flex items-center space-x-2 text-gray-500 text-sm">
        {result.tokenUsage?.map((usage) => (
          <span key={usage.modelName}>
            {usage.modelName}: {usage.inputTokens + usage.outputTokens} Tokens
          </span>
        ))}
      </div>
    </div>
  );
};
