import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Steps, Button } from 'antd';
import { ActionResult, ActionStep, Source } from '@refly/openapi-schema';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';
import { IconCheckCircle } from '@arco-design/web-react/icon';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@refly-packages/utils/cn';
import { IconCheck, IconLoading } from '@refly-packages/ai-workspace-common/components/common/icon';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { genUniqueId } from '@refly-packages/utils/id';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { SelectionContext } from '@refly-packages/ai-workspace-common/components/selection-context';
import { ActionContainer } from './action-container';
import { safeParseJSON } from '@refly-packages/utils/parse';
import { SourceViewer } from './source-viewer';
import { getArtifactIcon } from '@refly-packages/ai-workspace-common/components/common/result-display';
import { RecommendQuestions } from '@refly-packages/ai-workspace-common/components/canvas/node-preview/skill-response/recommend-questions';

export const ActionStepCard = ({
  result,
  step,
  stepStatus,
  index,
  query,
}: {
  result: ActionResult;
  step: ActionStep;
  stepStatus: 'executing' | 'finish';
  index: number;
  query: string;
}) => {
  const { t } = useTranslation();
  const { addSelectedNodeByEntity } = useCanvasControl();
  const [logBoxCollapsed, setLogBoxCollapsed] = useState(false);

  useEffect(() => {
    if (result?.status === 'finish') {
      setLogBoxCollapsed(true);
    } else if (result?.status === 'executing') {
      setLogBoxCollapsed(false);
    }
  }, [result?.status]);

  const buildNodeData = (text: string) => {
    const id = genUniqueId();

    const node: CanvasNode = {
      id,
      type: 'skillResponse',
      position: { x: 0, y: 0 },
      data: {
        entityId: result.resultId ?? '',
        title: result.title ?? 'Selected Content',
        metadata: {
          contentPreview: text,
          selectedContent: text,
          xPath: id,
          sourceEntityId: result.resultId ?? '',
          sourceEntityType: 'skillResponse',
          sourceType: 'skillResponseSelection',
        },
      },
    };

    return node;
  };

  const sources =
    typeof step?.structuredData?.['sources'] === 'string'
      ? safeParseJSON(step?.structuredData?.['sources'])
      : (step?.structuredData?.['sources'] as Source[]);
  const recommendedQuestions =
    typeof step?.structuredData?.['recommendedQuestions'] === 'string'
      ? safeParseJSON(step?.structuredData?.['recommendedQuestions'])
      : (step?.structuredData?.['recommendedQuestions'] as Array<string>);

  const logs = step?.logs?.filter((log) => log?.key);

  const skillName = result.actionMeta?.name || 'commonQnA';

  return (
    <div className="flex flex-col gap-1">
      <div className="my-1 text-gray-600 text-sm flex items-center gap-2 font-medium">
        {stepStatus === 'executing' ? (
          <IconLoading className="h-3 w-3 animate-spin text-green-500" />
        ) : (
          <IconCheck className="h-4 w-4 text-green-500" />
        )}
        {t('canvas.skillResponse.stepTitle', { index })}{' '}
        {' · ' + t(`${skillName}.steps.${step.name}.name`, { ns: 'skill', defaultValue: step.name })}
      </div>

      {logs?.length > 0 && (
        <div
          className={cn('my-2 p-4 border border-solid border-gray-200 rounded-lg transition-all', {
            'px-4 py-3 cursor-pointer hover:bg-gray-50': logBoxCollapsed,
            'relative pb-0': !logBoxCollapsed,
          })}
        >
          {logBoxCollapsed ? (
            <div
              className="text-gray-500 text-sm flex items-center justify-between"
              onClick={() => setLogBoxCollapsed(false)}
            >
              <div>
                <IconCheckCircle /> {t('canvas.skillResponse.stepCompleted')}
              </div>
              <div className="flex items-center">
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          ) : (
            <>
              <Steps
                direction="vertical"
                current={logs?.length ?? 0}
                size="small"
                items={logs.map((log) => ({
                  title: t(`${log.key}.title`, {
                    ...log.titleArgs,
                    ns: 'skillLog',
                    defaultValue: log.key,
                  }),
                  description: t(`${log.key}.description`, {
                    ...log.descriptionArgs,
                    ns: 'skillLog',
                    defaultValue: '',
                  }),
                }))}
              />
              <Button
                type="text"
                icon={<ChevronUp className="w-4 h-4 text-gray-500" />}
                onClick={() => setLogBoxCollapsed(true)}
                className="absolute right-2 top-2"
              />
            </>
          )}
        </div>
      )}

      {sources && <SourceViewer sources={sources} query={query} />}

      {step.content && (
        <div className="my-3 text-gray-600 text-base skill-response-content">
          <Markdown content={step.content} sources={sources} />
          <SelectionContext
            containerClass="skill-response-content"
            getNodeData={(text) => buildNodeData(text)}
          ></SelectionContext>
        </div>
      )}

      {step.artifacts?.map((artifact) => (
        <div
          key={artifact.entityId}
          className="my-2 px-4 py-2 h-12 border border-solid border-gray-200 rounded-lg flex items-center justify-between space-x-2 cursor-pointer hover:bg-gray-50"
          onClick={() => {
            addSelectedNodeByEntity({ type: artifact.type, entityId: artifact.entityId });
          }}
        >
          <div className="flex items-center space-x-2">
            {getArtifactIcon(artifact, 'w-4 h-4')}
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
                <span>{t('artifact.generating')}</span>
              </>
            )}
            {artifact.status === 'finish' && (
              <>
                <IconCheckCircle />
                <span>{t('artifact.completed')}</span>
              </>
            )}
          </div>
        </div>
      ))}

      <RecommendQuestions relatedQuestions={recommendedQuestions?.questions || []} />

      <ActionContainer result={result} step={step} />
    </div>
  );
};
