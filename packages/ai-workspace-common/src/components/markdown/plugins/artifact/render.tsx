import { memo, useEffect, useState } from 'react';
import { Spin, Drawer } from 'antd';
import { useTranslation } from 'react-i18next';
import { FiCode } from 'react-icons/fi';

import { MarkdownElementProps } from '../../types/index';
import { useActionResultStoreShallow } from '@refly-packages/ai-workspace-common/stores/action-result';
import { ARTIFACT_TAG_CLOSED_REGEX } from '@refly-packages/ai-workspace-common/modules/artifacts/const';
import { getArtifactContent } from '@refly-packages/ai-workspace-common/modules/artifacts/utils';
import { IconLoading } from '@refly-packages/ai-workspace-common/components/common/icon';
import { cn } from '@refly-packages/utils/cn';

interface CanvasProps extends MarkdownElementProps {
  identifier: string;
  title: string;
  type: string;
}

const isReflyCanvasClosed = (content: string) => {
  return ARTIFACT_TAG_CLOSED_REGEX.test(content || '');
};

const Render = memo<CanvasProps>(({ identifier, title, type, children, id }) => {
  const { t } = useTranslation();
  const hasChildren = !!children;
  const str = ((children as string) || '').toString?.();

  const [open, setOpen] = useState(false);

  // Use action result store to get status
  const [isGenerating, isCanvasTagClosed, canvasContent] = useActionResultStoreShallow((s) => {
    const result = s.resultMap[identifier];

    // Get content from result if possible
    let artifactContent = '';
    if (result?.steps?.length) {
      artifactContent = result.steps
        .map((step) => step?.content || '')
        .filter(Boolean)
        .join('\n');
    }

    // Otherwise try to extract from content string if available
    if (!artifactContent && hasChildren) {
      artifactContent = getArtifactContent(str);
    }

    return [
      // Status is generating if result exists and is not finished
      result ? ['executing', 'waiting'].includes(result.status) : false,
      // Canvas tag is closed if result is finished or if content format indicates it's closed
      result ? result.status === 'finish' : isReflyCanvasClosed(str),
      artifactContent,
    ];
  });

  const openCanvas = () => {
    setOpen(true);
  };

  useEffect(() => {
    if (!hasChildren || !isGenerating) return;

    openCanvas();
  }, [isGenerating, hasChildren, str, identifier, title, type, id]);

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-solid border-gray-300 bg-white hover:shadow-sm hover:bg-gray-50 transition-all duration-200">
      <div className="flex cursor-pointer transition-colors" onClick={openCanvas}>
        {/* Left section with gray background */}
        <div className="flex items-center justify-center bg-gray-50 p-3">
          <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
            <FiCode className="text-gray-500 text-sm" />
          </div>
        </div>

        {/* Right section with content */}
        <div className="flex-1 flex items-center p-3">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-800">
                {!title && isGenerating
                  ? t('artifact.generating', 'Canvas is generating...')
                  : title || 'Canvas'}
              </span>
            </div>

            <div className="flex items-center text-xs text-gray-500 mt-0.5">
              <span className="mr-2">{t('artifact.openComponent', 'Click to open component')}</span>
              {hasChildren && !isCanvasTagClosed && (
                <IconLoading className="w-2.5 h-2.5 text-blue-500 animate-spin" />
              )}
            </div>
          </div>

          {/* Arrow indicator */}
          <div className="flex-shrink-0 text-gray-400 ml-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      </div>

      <Drawer
        title={title || t('artifact.contentTitle', 'Canvas Content')}
        onClose={() => setOpen(false)}
        open={open}
        width={600}
        className="artifact-drawer"
      >
        <div
          className={cn(
            'p-4 rounded-lg',
            canvasContent
              ? 'bg-white'
              : 'bg-gray-50 flex items-center justify-center min-h-[100px]',
          )}
        >
          {canvasContent ? (
            <div className="prose max-w-none">{canvasContent}</div>
          ) : (
            <div className="text-gray-500 flex items-center">
              <Spin size="small" className="mr-2" />{' '}
              {t('artifact.loadingContent', 'Loading content...')}
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
});

export default Render;
