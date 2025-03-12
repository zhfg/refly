import { useCallback, useMemo, useState } from 'react';
import { Message as message, Tooltip, Button, Space } from '@arco-design/web-react';
import copyToClipboard from 'copy-to-clipboard';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { useAddNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-add-node';
import { genUniqueId } from '@refly-packages/utils/id';
import { CodeArtifactType } from '@refly-packages/ai-workspace-common/modules/artifacts/code-runner/types';
import { IconCopy, IconCode, IconEye } from '@arco-design/web-react/icon';
import { cn } from '@refly/utils';
import MermaidComponent from '../mermaid/render';
import Renderer from '@refly-packages/ai-workspace-common/modules/artifacts/code-runner/render';

// Language mapping for Monaco editor
const mapToMonacoLanguage = (lang: string): string => {
  const monacoLangMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    rb: 'ruby',
    md: 'markdown',
    mermaid: 'markdown',
    sh: 'shell',
    bash: 'shell',
    plaintext: 'plaintext',
    txt: 'plaintext',
    svg: 'xml',
  };

  return monacoLangMap[lang] || lang || 'plaintext';
};

interface PreCodeProps {
  children: any;
  id?: string; // resultId for connecting to skill response node
  'data-code-content'?: string;
  'data-code-type'?: CodeArtifactType;
  'data-language'?: string;
  'data-should-preview'?: boolean;
  'data-is-mermaid'?: boolean;
}

const PreCode = React.memo(
  ({
    children,
    id,
    'data-code-content': dataCodeContent,
    'data-code-type': dataCodeType,
    'data-language': dataLanguage,
    'data-should-preview': dataShouldPreview,
    'data-is-mermaid': dataIsMermaid,
  }: PreCodeProps) => {
    const { t } = useTranslation();

    // Get code content from props (injected by rehypePlugin)
    const codeContent = useMemo(() => dataCodeContent || '', [dataCodeContent]);

    // Get code type from props (injected by rehypePlugin)
    const codeType = useMemo(
      () => dataCodeType || 'application/refly.artifacts.code',
      [dataCodeType],
    );

    // Get language from props (injected by rehypePlugin)
    const language = useMemo(() => {
      if (dataLanguage) return mapToMonacoLanguage(dataLanguage);
      return 'plaintext';
    }, [dataLanguage]);

    // Is the code content a mermaid diagram?
    const isMermaid = useMemo(() => dataIsMermaid || false, [dataIsMermaid]);

    // Initialize the view mode based on the shouldPreview flag
    const [viewMode, setViewMode] = useState<'code' | 'preview'>(
      dataShouldPreview ? 'preview' : 'code',
    );

    // Check if this is a previewable type
    const isPreviewable = useMemo(
      () =>
        dataCodeType &&
        [
          'application/refly.artifacts.react',
          'image/svg+xml',
          'application/refly.artifacts.mermaid',
          'text/markdown',
          'text/html',
        ].includes(dataCodeType),
      [dataCodeType],
    );

    // If it's a mermaid diagram, render MermaidComponent
    if (isMermaid && codeContent) {
      return <MermaidComponent>{codeContent}</MermaidComponent>;
    }

    // Initialize add node hook
    const { addNode } = useAddNode();

    // Handle copy button click
    const handleCopy = useCallback(() => {
      copyToClipboard(codeContent);
      message.success(t('components.markdown.copySuccess'));
    }, [codeContent, t]);

    // Handle creating a code artifact node
    const handleCreateCodeArtifact = useCallback(() => {
      if (!codeContent) {
        message.error(t('components.markdown.emptyCode', 'Cannot create empty code artifact'));
        return;
      }

      try {
        const nodeId = `code-artifact-${genUniqueId()}`;

        // Create node data
        addNode(
          {
            type: 'codeArtifact',
            data: {
              entityId: nodeId,
              title: `Code (${language})`,
              contentPreview: codeContent,
              metadata: {
                code: codeContent,
                language,
                type: codeType,
                activeTab: 'code',
                width: 600,
                height: 400,
                status: 'finished',
              },
            },
          },
          id ? [{ type: 'skillResponse', entityId: id }] : undefined,
        );

        message.success(t('components.markdown.codeArtifactCreated', 'Code artifact created'));
      } catch (error) {
        console.error('Error creating code artifact:', error);
        message.error(t('components.markdown.codeArtifactError', 'Error creating code artifact'));
      }
    }, [language, codeType, addNode, id, t, codeContent]);

    // Toggle between code and preview mode
    const toggleViewMode = useCallback(() => {
      setViewMode((prev) => (prev === 'code' ? 'preview' : 'code'));
    }, []);

    // Render the code preview if in preview mode and the type is previewable
    if (viewMode === 'preview' && isPreviewable) {
      return (
        <div className="relative group p-4 border rounded bg-white">
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Space>
              <Tooltip content={t('copilot.message.copy', 'Copy code')}>
                <Button
                  type="secondary"
                  size="mini"
                  className="flex items-center justify-center bg-white/80 hover:bg-white border border-gray-200"
                  icon={<IconCopy />}
                  onClick={handleCopy}
                />
              </Tooltip>
              <Tooltip content={t('components.markdown.viewCode', 'View code')}>
                <Button
                  type="secondary"
                  size="mini"
                  className="flex items-center justify-center bg-white/80 hover:bg-white border border-gray-200"
                  icon={<IconCode />}
                  onClick={toggleViewMode}
                />
              </Tooltip>
            </Space>
          </div>
          <Renderer
            content={codeContent}
            type={codeType}
            language={language}
            onRequestFix={() => {}}
          />
        </div>
      );
    }

    // Otherwise render normal code block with improved buttons
    return (
      <pre className={cn('relative group')}>
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Space>
            <Tooltip content={t('copilot.message.copy', 'Copy code')}>
              <Button
                type="secondary"
                size="mini"
                className="flex items-center justify-center bg-white/80 hover:bg-white border border-gray-200"
                icon={<IconCopy />}
                onClick={handleCopy}
              />
            </Tooltip>
            {isPreviewable && (
              <Tooltip content={t('components.markdown.viewPreview', 'View preview')}>
                <Button
                  type="secondary"
                  size="mini"
                  className="flex items-center justify-center bg-white/80 hover:bg-white border border-gray-200"
                  icon={<IconEye />}
                  onClick={toggleViewMode}
                />
              </Tooltip>
            )}
            <Tooltip content={t('components.markdown.createCodeArtifact', 'Create code artifact')}>
              <Button
                type="secondary"
                size="mini"
                className="flex items-center justify-center bg-white/80 hover:bg-white border border-gray-200"
                icon={<IconCode />}
                onClick={handleCreateCodeArtifact}
              />
            </Tooltip>
          </Space>
        </div>
        {children}
      </pre>
    );
  },
);

PreCode.displayName = 'PreCode';

export default PreCode;
