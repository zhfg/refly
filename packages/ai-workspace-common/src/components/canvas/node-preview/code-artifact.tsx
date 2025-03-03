import { useState, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CanvasNode,
  CodeArtifactNodeMeta,
} from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { useGetDocumentDetail } from '@refly-packages/ai-workspace-common/queries';
import { useActionResultStoreShallow } from '@refly-packages/ai-workspace-common/stores/action-result';
import CodeViewerLayout from '@refly-packages/ai-workspace-common/modules/artifacts/code-runner/code-viewer-layout';
import CodeViewer from '@refly-packages/ai-workspace-common/modules/artifacts/code-runner/code-viewer';
import { Spin } from 'antd';

interface CodeArtifactNodePreviewProps {
  node: CanvasNode<CodeArtifactNodeMeta>;
  artifactId: string;
}

const CodeArtifactNodePreviewComponent = ({ node, artifactId }: CodeArtifactNodePreviewProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [isShowingCodeViewer, setIsShowingCodeViewer] = useState(true);

  // Try to get content from the action result store first
  const [codeContent] = useActionResultStoreShallow((s) => {
    // Look up content from result steps
    const result = s.resultMap[artifactId];
    let artifactContent = '';

    if (result?.steps?.length) {
      artifactContent = result.steps
        .map((step) => step?.content || '')
        .filter(Boolean)
        .join('\n');
    }

    return [artifactContent];
  });

  // Fallback to document API if not found in action result store
  const { data: documentData, isLoading } = useGetDocumentDetail(
    { query: { docId: artifactId } },
    null,
    {
      enabled: !codeContent && !!artifactId,
      staleTime: 60 * 1000, // Data fresh for 1 minute
      gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    },
  );

  const handleRequestFix = useCallback((error: string) => {
    console.error('Code artifact error:', error);
  }, []);

  const handleClose = useCallback(() => {
    setIsShowingCodeViewer(false);
  }, []);

  if (!artifactId) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded p-3">
        <span className="text-gray-500">
          {t('codeArtifact.noSelection', 'No code artifact selected')}
        </span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded p-3">
        <Spin size="small" />
        <span className="ml-2 text-gray-500">{t('codeArtifact.loading', 'Loading code...')}</span>
      </div>
    );
  }

  // Determine which content to show - prefer action result store content, fallback to document content
  const content = codeContent || documentData?.data?.content || '';
  const { language = 'typescript' } = node.data?.metadata || {};
  const isGenerating = node.data?.metadata?.status === 'generating';

  return (
    <div className="h-full bg-white rounded px-4">
      <CodeViewerLayout isShowing={isShowingCodeViewer}>
        {isShowingCodeViewer && (
          <CodeViewer
            code={content}
            language={language}
            title={node.data?.title || t('codeArtifact.defaultTitle', 'Code Artifact')}
            isGenerating={isGenerating}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onClose={handleClose}
            onRequestFix={handleRequestFix}
          />
        )}
      </CodeViewerLayout>
    </div>
  );
};

export const CodeArtifactNodePreview = memo(
  CodeArtifactNodePreviewComponent,
  (prevProps, nextProps) => prevProps.artifactId === nextProps.artifactId,
);
