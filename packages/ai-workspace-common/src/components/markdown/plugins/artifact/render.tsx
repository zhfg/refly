import { memo, useEffect, useState } from 'react';
import { Spin, Drawer, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { FiCode } from 'react-icons/fi';

import { MarkdownElementProps } from '../../types/index';
import { useActionResultStoreShallow } from '@refly-packages/ai-workspace-common/stores/action-result';
import { ARTIFACT_TAG_CLOSED_REGEX } from '@refly-packages/ai-workspace-common/modules/artifacts/const';
import { getArtifactContent } from '@refly-packages/ai-workspace-common/modules/artifacts/utils';
import { IconLoading } from '@refly-packages/ai-workspace-common/components/common/icon';
import { cn } from '@refly-packages/utils/cn';
import CodeViewerLayout from '@refly-packages/ai-workspace-common/modules/artifacts/code-runner/code-viewer-layout';
import CodeViewer from '@refly-packages/ai-workspace-common/modules/artifacts/code-runner/code-viewer';

interface CanvasProps extends MarkdownElementProps {
  identifier: string;
  title: string;
  type: string;
  language: string;
}

const isReflyCanvasClosed = (content: string) => {
  return ARTIFACT_TAG_CLOSED_REGEX.test(content || '');
};

const Render = memo<CanvasProps>((props: CanvasProps) => {
  const { identifier, title, language, children, id } = props;
  const { t } = useTranslation();
  const hasChildren = !!children;
  const str = ((children as string) || '').toString?.();

  const [open, setOpen] = useState(false);
  const [isShowingCodeViewer, setIsShowingCodeViewer] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');

  console.log('Render component props:', props);

  // Use action result store to get status
  const [isGenerating, isCanvasTagClosed, canvasContent] = useActionResultStoreShallow((s) => {
    // Prioritize using id from props if available, otherwise fallback to identifier
    const lookupId = id;
    const result = s.resultMap[lookupId];

    console.log('Action result lookup:', {
      storeKeys: Object.keys(s.resultMap),
      lookupId,
      originalIdentifier: identifier,
      propsId: id,
      foundResult: !!result,
      resultStatus: result?.status,
      result: result,
    });

    // Get content from result if possible
    let artifactContent = '';
    if (result?.steps?.length) {
      artifactContent = result.steps
        .map((step) => step?.content || '')
        .filter(Boolean)
        .join('\n');
    }

    artifactContent = getArtifactContent(artifactContent);

    if (!artifactContent && hasChildren) {
      artifactContent = str;
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
    setIsShowingCodeViewer(true);
  };

  useEffect(() => {
    if (!hasChildren || !isGenerating) return;

    openCanvas();
  }, [isGenerating, hasChildren, str, identifier, title, language, id]);

  const handleRequestFix = (error: string) => {
    // We'll simplify this to just show an alert since we don't have
    // the original implementation context
    message.error(`Render component error: ${error}`);
  };

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
        width="50%"
        className="artifact-drawer"
        styles={{
          body: { padding: 0 },
          content: { display: 'flex', flexDirection: 'column', height: '100%' },
        }}
      >
        <div
          className={cn(
            'p-4 rounded-lg flex-1 overflow-auto',
            canvasContent
              ? 'bg-white'
              : 'bg-gray-50 flex items-center justify-center min-h-[100px]',
          )}
        >
          {canvasContent ? (
            <CodeViewerLayout isShowing={isShowingCodeViewer}>
              {isShowingCodeViewer && (
                <CodeViewer
                  code={canvasContent}
                  language={language}
                  title={title}
                  isGenerating={isGenerating}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  onClose={() => {
                    setIsShowingCodeViewer(false);
                    setOpen(false);
                  }}
                  onRequestFix={handleRequestFix}
                />
              )}
            </CodeViewerLayout>
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
