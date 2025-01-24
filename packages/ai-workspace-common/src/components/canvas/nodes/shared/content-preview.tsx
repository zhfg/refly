import { memo, useMemo } from 'react';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';
import { Spin } from '@refly-packages/ai-workspace-common/components/common/spin';
import { Source } from '@refly/openapi-schema';

interface ContentPreviewProps {
  content: string;
  sources?: Source[];
  sizeMode: 'compact' | 'adaptive';
  isOperating: boolean;
  isLoading?: boolean;
  maxCompactLength?: number;
  className?: string;
}

export const ContentPreview = memo(
  ({
    content,
    sources,
    sizeMode,
    isOperating,
    isLoading,
    maxCompactLength = 10,
    className = '',
  }: ContentPreviewProps) => {
    const previewContent = useMemo(() => {
      if (sizeMode === 'compact') {
        return `${content?.slice(0, maxCompactLength)}...` || '';
      }
      return content || '';
    }, [content, sizeMode, maxCompactLength]);

    return (
      <Spin spinning={isLoading}>
        <Markdown
          className={`text-xs overflow-hidden ${isOperating ? 'pointer-events-auto cursor-text select-text' : 'pointer-events-none select-none'} ${className}`}
          content={previewContent}
          sources={sources || []}
        />
      </Spin>
    );
  },
);
