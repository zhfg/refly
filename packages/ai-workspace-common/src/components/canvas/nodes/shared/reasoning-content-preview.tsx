import { memo, useMemo, useState, useEffect } from 'react';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';
import { Source } from '@refly/openapi-schema';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@refly-packages/utils/cn';
import { useTranslation } from 'react-i18next';
import { Button } from 'antd';
import { getParsedReasoningContent } from '@refly-packages/utils/content-parser';
import { IconThinking } from '@refly-packages/ai-workspace-common/components/common/icon';

interface ReasoningContentPreviewProps {
  content: string;
  sources?: Source[];
  isOperating: boolean;
  stepStatus: 'executing' | 'finish';
  className?: string;
}

export const ReasoningContentPreview = memo(
  ({ content, sources, isOperating, stepStatus, className = '' }: ReasoningContentPreviewProps) => {
    const { t } = useTranslation();
    const [collapsed, setCollapsed] = useState(stepStatus !== 'executing');

    // Auto-collapse when step status changes from executing to finish
    useEffect(() => {
      if (stepStatus === 'executing') {
        setCollapsed(false);
      } else {
        setCollapsed(true);
      }
    }, [stepStatus]);

    // Memoize className to prevent re-renders when only isOperating changes
    const markdownClassName = useMemo(
      () =>
        `text-xs overflow-hidden ${
          isOperating
            ? 'pointer-events-auto cursor-text select-text'
            : 'pointer-events-none select-none'
        } ${className}`,
      [isOperating, className],
    );

    if (!content) return null;

    return (
      <div>
        <div
          className={cn('p-3 bg-gray-50 rounded-lg border border-gray-200 transition-all', {
            'cursor-pointer hover:bg-gray-100': collapsed,
          })}
        >
          {collapsed ? (
            <div
              className="flex items-center justify-between text-xs"
              onClick={() => setCollapsed(false)}
            >
              <div className="flex items-center gap-1">
                <IconThinking className="w-4 h-4" />
                {t('canvas.skillResponse.reasoningContent')}
              </div>
              <ChevronDown className="w-4 h-4" />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 text-xs font-medium">
                  <IconThinking className="w-4 h-4" />
                  {t('canvas.skillResponse.reasoningContent')}
                </div>
                <Button
                  type="text"
                  icon={<ChevronUp className="w-4 h-4" />}
                  onClick={() => setCollapsed(true)}
                  size="small"
                  className="flex items-center justify-center h-6 w-6 min-w-0 p-0"
                />
              </div>
              <Markdown
                className={markdownClassName}
                content={getParsedReasoningContent(content)}
                sources={sources || []}
              />
            </div>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.content === nextProps.content &&
      prevProps.isOperating === nextProps.isOperating &&
      prevProps.stepStatus === nextProps.stepStatus &&
      prevProps.className === nextProps.className &&
      JSON.stringify(prevProps.sources) === JSON.stringify(nextProps.sources)
    );
  },
);
