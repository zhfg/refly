import { useRef, useCallback, useMemo } from 'react';
import { Message as message, Tooltip, Button, Space } from '@arco-design/web-react';
import copyToClipboard from 'copy-to-clipboard';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { useAddNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-add-node';
import { genUniqueId } from '@refly-packages/utils/id';
import { CodeArtifactType } from '@refly-packages/ai-workspace-common/modules/artifacts/code-runner/types';
import { IconCopy, IconCode } from '@arco-design/web-react/icon';
import { cn } from '@refly/utils';
import MermaidComponent from '../mermaid/render';

// Helper function to determine the appropriate code artifact type
const getCodeArtifactType = (className: string): CodeArtifactType => {
  if (!className) return 'application/refly.artifacts.code';

  if (
    className.includes('language-jsx') ||
    className.includes('language-tsx') ||
    className.includes('language-react')
  ) {
    return 'application/refly.artifacts.react';
  }

  if (className.includes('language-html')) {
    return 'text/html';
  }

  if (className.includes('language-markdown') || className.includes('language-md')) {
    return 'text/markdown';
  }

  if (className.includes('language-svg')) {
    return 'image/svg+xml';
  }

  return 'application/refly.artifacts.code';
};

// Helper function to extract language from className
const getLanguageFromClassName = (className: string): string => {
  if (!className) return 'plaintext';

  const match = className.match(/language-(\w+)/);
  return match ? match[1] : 'plaintext';
};

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
  };

  return monacoLangMap[lang] || lang || 'plaintext';
};

interface PreCodeProps {
  children: any;
  id?: string; // resultId for connecting to skill response node
}

const PreCode = React.memo(({ children, id }: PreCodeProps) => {
  const ref = useRef<HTMLPreElement>(null);
  const { t } = useTranslation();

  // Get language from className
  const languageClass = useMemo(() => {
    const child = children?.[0];
    return child?.props?.className ?? '';
  }, [children]);

  // Get the proper language for Monaco
  const language = useMemo(() => {
    const extractedLang = getLanguageFromClassName(languageClass);
    return mapToMonacoLanguage(extractedLang);
  }, [languageClass]);

  // Check if the code is mermaid diagram - We'll let mermaid component handle it
  const isMermaid = useMemo(() => {
    return languageClass?.includes('language-mermaid');
  }, [languageClass]);

  // If it's a mermaid diagram, simply return children to let mermaid component handle it
  const mermaidContent = useMemo(() => {
    if (!isMermaid) return null;
    const childNode = children?.[0];
    return childNode?.props?.children;
  }, [isMermaid, children]);

  // If it's a mermaid diagram, render MermaidComponent
  if (isMermaid && mermaidContent) {
    return <MermaidComponent>{mermaidContent}</MermaidComponent>;
  }

  // Only initialize these for non-mermaid code
  const { addNode } = useAddNode();

  const handleCopy = useCallback(() => {
    if (ref.current) {
      // Find the code element inside pre and get its text content
      const codeElement = ref.current.querySelector('code');
      const code = codeElement?.textContent ?? '';
      copyToClipboard(code);
      message.success(t('components.markdown.copySuccess'));
    }
  }, [t]);

  // Handle creating a code artifact node - Only needed for non-mermaid code
  const handleCreateCodeArtifact = useCallback(() => {
    // 直接从 DOM 获取代码内容，避免闭包问题
    let actualCodeContent = '';
    if (ref.current) {
      const codeElement = ref.current.querySelector('code');
      actualCodeContent = codeElement?.textContent ?? '';
    }

    if (!actualCodeContent) {
      message.error(t('components.markdown.emptyCode', 'Cannot create empty code artifact'));
      return;
    }

    try {
      const codeArtifactType = getCodeArtifactType(languageClass);
      const nodeId = `code-artifact-${genUniqueId()}`;

      // Create node data
      addNode(
        {
          type: 'codeArtifact',
          data: {
            entityId: nodeId,
            title: `Code (${language})`,
            contentPreview: actualCodeContent,
            metadata: {
              code: actualCodeContent,
              language,
              type: codeArtifactType,
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
  }, [languageClass, language, addNode, id, t, ref]);

  // Otherwise render normal code block with improved buttons
  return (
    <pre ref={ref} className={cn('relative group')}>
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
});

PreCode.displayName = 'PreCode';

export default PreCode;
