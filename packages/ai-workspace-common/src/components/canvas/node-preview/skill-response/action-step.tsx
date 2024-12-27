import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Steps, Button } from 'antd';
import { ActionResult, ActionStep, Source } from '@refly/openapi-schema';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';
import { IconCheckCircle } from '@arco-design/web-react/icon';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@refly-packages/utils/cn';
import { IconCheck, IconLoading } from '@refly-packages/ai-workspace-common/components/common/icon';
import { genUniqueId } from '@refly-packages/utils/id';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { SelectionContext } from '@refly-packages/ai-workspace-common/modules/selection-menu/selection-context';
import { ActionContainer } from './action-container';
import { safeParseJSON } from '@refly-packages/utils/parse';
import { SourceViewer } from './source-viewer';
import { getArtifactIcon } from '@refly-packages/ai-workspace-common/components/common/result-display';
import { RecommendQuestions } from '@refly-packages/ai-workspace-common/components/canvas/node-preview/skill-response/recommend-questions';
import { getClientOrigin } from '@refly-packages/utils/url';
import { memo } from 'react';
import { useNodeSelection } from '@refly-packages/ai-workspace-common/hooks/canvas/use-node-selection';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';
import { useCanvasId } from '@refly-packages/ai-workspace-common/hooks/canvas/use-canvas-id';

const parseStructuredData = (structuredData: Record<string, unknown>, field: string) => {
  return typeof structuredData[field] === 'string'
    ? safeParseJSON(structuredData[field])
    : (structuredData[field] as Source[]);
};

// 抽离日志组件
const LogBox = memo(
  ({
    logs,
    collapsed,
    onCollapse,
    t,
    status,
    log,
  }: {
    logs: any[];
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
    t: any;
    status: string;
    log?: { key: string; titleArgs?: any; descriptionArgs?: any };
  }) => {
    if (!logs?.length) return null;

    console.log('logs', logs);

    const logTitle = log
      ? t(`${log.key}.title`, {
          ...log.titleArgs,
          ns: 'skillLog',
          defaultValue: log.key,
        })
      : '';

    const logDescription = log
      ? t(`${log.key}.description`, {
          ...log.descriptionArgs,
          ns: 'skillLog',
          defaultValue: '',
        })
      : '';

    return (
      <div
        className={cn('my-2 p-4 border border-solid border-gray-200 rounded-lg transition-all', {
          'px-4 py-3 cursor-pointer hover:bg-gray-50': collapsed,
          'relative pb-0': !collapsed,
        })}
      >
        {collapsed ? (
          <div className="text-gray-500 text-sm flex items-center justify-between" onClick={() => onCollapse(false)}>
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
              onClick={() => onCollapse(true)}
              className="absolute right-2 top-2"
            />
          </>
        )}

        {(status === 'waiting' || status === 'executing') && (
          <div className="flex items-center gap-2 bg-gray-100 rounded-sm p-2">
            <IconLoading className="h-3 w-3 animate-spin text-green-500" />
            <span className="text-xs text-gray-500 max-w-48 truncate">
              {log ? (
                <>
                  <span className="text-green-500 font-medium">{logTitle + ' '}</span>
                  <span className="text-gray-500">{logDescription}</span>
                </>
              ) : (
                t('canvas.skillResponse.aiThinking')
              )}
            </span>
          </div>
        )}
      </div>
    );
  },
);

// 抽离内容组件
const StepContent = memo(
  ({
    content,
    sources,
    buildNodeData,
    step,
  }: {
    content: string;
    sources: Source[];
    buildNodeData: (text: string) => CanvasNode;
    step: ActionStep;
  }) => {
    console.log('stepcontent', step);

    return (
      <div className="my-3 text-gray-600 text-base skill-response-content">
        <Markdown content={content} sources={sources} />
        {step?.name === 'answerGeneration' ? (
          <SelectionContext containerClass="skill-response-content" getNodeData={buildNodeData} />
        ) : null}
      </div>
    );
  },
);

// 抽离 Artifact 组件
const ArtifactItem = memo(({ artifact, onSelect }: { artifact: any; onSelect: () => void }) => {
  const { t } = useTranslation();

  return (
    <div
      key={artifact.entityId}
      className="my-2 px-4 py-2 h-12 border border-solid border-gray-200 rounded-lg flex items-center justify-between space-x-2 cursor-pointer hover:bg-gray-50"
      onClick={onSelect}
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
  );
});

export const ActionStepCard = memo(
  ({
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
    const canvasId = useCanvasId();
    const { setSelectedNodeByEntity } = useNodeSelection();
    const [logBoxCollapsed, setLogBoxCollapsed] = useState(false);

    console.log('ActionStepCard', result);

    useEffect(() => {
      if (result?.status === 'finish') {
        setLogBoxCollapsed(true);
      } else if (result?.status === 'executing') {
        setLogBoxCollapsed(false);
      }
    }, [result?.status]);

    const buildNodeData = useCallback(
      (text: string) => {
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
              url: getClientOrigin(),
            },
          },
        };

        return node;
      },
      [result.resultId, result.title],
    );

    // 使用 useMemo 缓存解析数据
    const parsedData = useMemo(
      () => ({
        sources: parseStructuredData(step?.structuredData, 'sources'),
        recommendedQuestions: parseStructuredData(step?.structuredData, 'recommendedQuestions'),
      }),
      [step?.structuredData],
    );

    const logs = step?.logs?.filter((log) => log?.key);
    const skillName = result.actionMeta?.name || 'commonQnA';

    // 使用 useCallback 缓存事件处理函数
    const handleArtifactSelect = useCallback(
      (artifact) => {
        setSelectedNodeByEntity({
          type: artifact.type,
          entityId: artifact.entityId,
        });
      },
      [setSelectedNodeByEntity],
    );

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
          <LogBox
            logs={logs}
            collapsed={logBoxCollapsed}
            onCollapse={setLogBoxCollapsed}
            t={t}
            status={stepStatus}
            log={step?.logs?.[step.logs.length - 1]}
          />
        )}

        {parsedData.sources && <SourceViewer sources={parsedData.sources} query={query} />}

        {step.content && (
          <StepContent content={step.content} sources={parsedData.sources} buildNodeData={buildNodeData} step={step} />
        )}

        {step.artifacts?.map((artifact) => (
          <ArtifactItem key={artifact.entityId} artifact={artifact} onSelect={() => handleArtifactSelect(artifact)} />
        ))}

        <RecommendQuestions relatedQuestions={parsedData.recommendedQuestions?.questions || []} />

        <ActionContainer result={result} step={step} />
      </div>
    );
  },
);
