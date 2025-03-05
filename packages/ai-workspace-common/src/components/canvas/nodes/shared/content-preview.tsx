import { memo, useMemo } from 'react';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';
import { Source } from '@refly/openapi-schema';

interface ContentPreviewProps {
  content: string;
  sources?: Source[];
  sizeMode: 'compact' | 'adaptive';
  isOperating: boolean;
  className?: string;
  resultId?: string;
}

export const ContentPreview = memo(
  ({ content, sources, sizeMode, isOperating, className = '', resultId }: ContentPreviewProps) => {
    const previewContent = content ?? '';

    // Memoize className to prevent re-renders when only isOperating changes
    const markdownClassName = useMemo(
      () =>
        `text-xs overflow-hidden ${sizeMode === 'compact' ? 'max-h-[1.5rem] line-clamp-1' : ''} ${
          isOperating
            ? 'pointer-events-auto cursor-text select-text'
            : 'pointer-events-none select-none'
        } ${className}`,
      [isOperating, sizeMode, className],
    );

    return (
      <Markdown
        className={markdownClassName}
        content={previewContent}
        sources={sources ?? []}
        resultId={resultId}
      />
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.content === nextProps.content &&
      prevProps.sizeMode === nextProps.sizeMode &&
      prevProps.isOperating === nextProps.isOperating &&
      prevProps.className === nextProps.className &&
      JSON.stringify(prevProps.sources) === JSON.stringify(nextProps.sources)
    );
  },
);
