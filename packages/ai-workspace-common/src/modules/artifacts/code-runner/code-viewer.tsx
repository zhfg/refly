import { FiRefreshCw, FiDownload, FiCopy, FiCode, FiEye, FiShare2 } from 'react-icons/fi';
import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Button, Tooltip, Divider, message, Select } from 'antd';
import Renderer from './render';
import Editor, { Monaco } from '@monaco-editor/react';
import { useTranslation } from 'react-i18next';
import { CodeArtifactType } from './types';
import { copyToClipboard } from '@refly-packages/ai-workspace-common/utils';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { getShareLink } from '@refly-packages/ai-workspace-common/utils/share';

// Function to get simple type description
const getSimpleTypeDescription = (type: CodeArtifactType): string => {
  const typeMap: Record<CodeArtifactType, string> = {
    'application/refly.artifacts.react': 'React',
    'image/svg+xml': 'SVG',
    'application/refly.artifacts.mermaid': 'Mermaid',
    'text/markdown': 'Markdown',
    'application/refly.artifacts.code': 'Code',
    'text/html': 'HTML',
  };
  return typeMap[type] ?? type;
};

// Function to get all available artifact types with labels
const getArtifactTypeOptions = () => {
  const typeMap: Record<CodeArtifactType, string> = {
    'application/refly.artifacts.react': 'React',
    'image/svg+xml': 'SVG',
    'application/refly.artifacts.mermaid': 'Mermaid',
    'text/markdown': 'Markdown',
    'application/refly.artifacts.code': 'Code',
    'text/html': 'HTML',
  };

  return Object.entries(typeMap).map(([value, label]) => ({
    value: value as CodeArtifactType,
    label,
  }));
};

// Function to map CodeArtifactType to appropriate Monaco editor language
const getLanguageFromType = (type: CodeArtifactType, language: string): string => {
  const languageMap: Record<CodeArtifactType, string> = {
    'application/refly.artifacts.react': 'typescript',
    'image/svg+xml': 'xml',
    'application/refly.artifacts.mermaid': 'markdown',
    'text/markdown': 'markdown',
    'application/refly.artifacts.code': language, // Use provided language
    'text/html': 'html',
  };

  return languageMap[type] ?? language;
};

// Function to get file extension based on artifact type
const getFileExtensionFromType = (type: CodeArtifactType): string => {
  const extensionMap: Record<CodeArtifactType, string> = {
    'application/refly.artifacts.react': 'tsx',
    'image/svg+xml': 'svg',
    'application/refly.artifacts.mermaid': 'mmd',
    'text/markdown': 'md',
    'application/refly.artifacts.code': '', // Will be determined by language
    'text/html': 'html',
  };
  return extensionMap[type] ?? '';
};

export default memo(
  function CodeViewer({
    code,
    language,
    title,
    entityId,
    isGenerating,
    activeTab,
    onTabChange,
    onClose: _onClose,
    onRequestFix,
    onChange,
    readOnly = false,
    canvasReadOnly = false,
    type = 'text/html',
    onTypeChange,
  }: {
    code: string;
    language: string;
    title: string;
    entityId: string;
    isGenerating: boolean;
    activeTab: string;
    onTabChange: (v: 'code' | 'preview') => void;
    onClose: () => void;
    onRequestFix: (e: string) => void;
    onChange?: (code: string) => void;
    readOnly?: boolean;
    canvasReadOnly?: boolean;
    type?: CodeArtifactType;
    onTypeChange?: (type: CodeArtifactType) => void;
  }) {
    // console.log('code-artifact-viewer', code, language, title, type);
    const { t } = useTranslation();
    const [refresh, setRefresh] = useState(0);
    // Track editor content for controlled updates
    const [editorContent, setEditorContent] = useState(code);

    // Update editor content when code prop changes
    useEffect(() => {
      setEditorContent(code);
    }, [code]);

    // Set up Monaco editor with proper language support
    useEffect(() => {
      // No need to configure loader without direct monaco import
      // loader.config({ monaco });

      // Setup will happen in beforeMount callback instead
      return () => {
        // Cleanup if needed
      };
    }, []);

    const handleCopyCode = useCallback(
      (event: React.MouseEvent) => {
        event.stopPropagation();
        navigator.clipboard
          .writeText(editorContent)
          .then(() => {
            message.success(t('codeArtifact.copySuccess'));
          })
          .catch((error) => {
            console.error('Failed to copy code:', error);
            message.error(t('codeArtifact.copyError'));
          });
      },
      [editorContent, t],
    );

    const handleDownload = useCallback(
      (event: React.MouseEvent) => {
        event.stopPropagation();
        const fileExtension = getFileExtensionForLanguage(language);
        const fileName = `${title}.${fileExtension}`;
        try {
          const blob = new Blob([editorContent], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          message.success(t('codeArtifact.downloadSuccess', { fileName }));
        } catch (error) {
          console.error('Failed to download file:', error);
          message.error(t('codeArtifact.downloadError'));
        }
      },
      [language, editorContent, title, t],
    );

    // Handle content changes from editor
    const handleEditorChange = useCallback(
      (value: string | undefined) => {
        if (value !== undefined) {
          setEditorContent(value);
          onChange?.(value);
        }
      },
      [onChange],
    );

    const handleRefresh = useCallback(
      (event: React.MouseEvent) => {
        event.stopPropagation();
        setRefresh((r) => r + 1);
        message.info(t('codeArtifact.refreshing'));
      },
      [t],
    );

    const getFileExtensionForLanguage = useMemo(
      () =>
        (lang: string): string => {
          // First check if we have a type-specific extension
          const typeExtension = getFileExtensionFromType(type);
          if (typeExtension) {
            return typeExtension;
          }

          // Fall back to language-based extension
          const extensionMap: Record<string, string> = {
            javascript: 'js',
            typescript: 'ts',
            python: 'py',
            html: 'html',
            css: 'css',
            java: 'java',
            csharp: 'cs',
            php: 'php',
            go: 'go',
            ruby: 'rb',
            rust: 'rs',
            jsx: 'jsx',
            tsx: 'tsx',
            markdown: 'md',
            xml: 'xml',
          };

          return extensionMap[lang.toLowerCase()] || 'txt';
        },
      [type],
    );

    const handleShare = useCallback(
      async (event: React.MouseEvent) => {
        event.stopPropagation();
        const loadingMessage = message.loading(t('codeArtifact.sharing'), 0);

        const { data, error } = await getClient().createShare({
          body: {
            entityId,
            entityType: 'codeArtifact',
            shareData: JSON.stringify({
              content: editorContent,
              type,
              title,
              language,
            }),
          },
        });

        if (!data.success || error) {
          loadingMessage();
          console.error('Failed to share code:', error);
          message.error(t('codeArtifact.shareError'));
        } else {
          const shareLink = getShareLink('codeArtifact', data.data?.shareId ?? '');

          // Copy the sharing link to clipboard
          copyToClipboard(shareLink);

          // Clear loading message and show success with the link
          loadingMessage();
          message.success(t('codeArtifact.shareSuccess'));
        }
      },
      [editorContent, type, title, language, t, entityId],
    );

    // Memoize the render tabs
    const renderTabs = useMemo(
      () => (
        <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
          <Button
            type={activeTab === 'preview' ? 'primary' : 'text'}
            icon={<FiEye className="size-4 mr-1" />}
            onClick={(e) => {
              e.stopPropagation();
              onTabChange?.('preview');
            }}
            className={`${activeTab === 'preview' ? 'bg-green-600' : 'text-gray-600'}`}
            size="small"
          >
            {t('codeArtifact.tabs.preview')}
          </Button>

          <Button
            type={activeTab === 'code' ? 'primary' : 'text'}
            icon={<FiCode className="size-4 mr-1" />}
            onClick={(e) => {
              e.stopPropagation();
              onTabChange?.('code');
            }}
            className={`${activeTab === 'code' ? 'bg-green-600' : 'text-gray-600'}`}
            size="small"
          >
            {t('codeArtifact.tabs.code')}
          </Button>
        </div>
      ),
      [activeTab, onTabChange, t],
    );

    // Memoize action buttons
    const actionButtons = useMemo(
      () => (
        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          <Tooltip title={t('codeArtifact.buttons.copy')}>
            <Button
              type="text"
              icon={<FiCopy className="size-4" />}
              onClick={handleCopyCode}
              size="small"
              className="text-gray-600 hover:text-blue-600"
            />
          </Tooltip>

          <Tooltip
            title={t('codeArtifact.buttons.download', {
              fileName: `${title}.${getFileExtensionForLanguage(language)}`,
            })}
          >
            <Button
              type="text"
              icon={<FiDownload className="size-4" />}
              onClick={handleDownload}
              size="small"
              className="text-gray-600 hover:text-blue-600"
            />
          </Tooltip>
        </div>
      ),
      [
        handleCopyCode,
        handleDownload,
        handleShare,
        title,
        language,
        getFileExtensionForLanguage,
        t,
      ],
    );

    // console.log('code-artifact-viewer', code, language, title, type);

    return (
      <div
        className="flex flex-col h-full border border-gray-200 bg-white"
        style={{ height: '100%' }}
      >
        {/* Top header with main tab navigation */}
        <div className="flex items-center justify-between h-12 border-b border-gray-200 bg-white py-2">
          {renderTabs}

          <div className="flex items-center space-x-2">
            {!canvasReadOnly && (
              <Tooltip title={t('codeArtifact.buttons.share')}>
                <Button
                  type="text"
                  disabled={canvasReadOnly}
                  icon={<FiShare2 className="size-4 text-green-600" />}
                  onClick={handleShare}
                  size="small"
                  className="text-gray-600 hover:text-blue-600"
                />
              </Tooltip>
            )}

            <Tooltip title={t('codeArtifact.buttons.refresh')}>
              <Button
                type="text"
                icon={<FiRefreshCw className="size-4" />}
                onClick={handleRefresh}
                disabled={isGenerating}
                size="small"
                className="text-gray-600 hover:text-blue-600"
              />
            </Tooltip>
          </div>
        </div>

        <Divider className="my-0" style={{ margin: 0, height: '1px' }} />

        {/* Breadcrumb and action buttons */}
        <div className="flex justify-between items-center py-2 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-2">
            {onTypeChange ? (
              <Select
                value={type}
                onChange={onTypeChange}
                options={getArtifactTypeOptions()}
                size="small"
                className="w-32"
                dropdownMatchSelectWidth={false}
              />
            ) : (
              <span className="text-sm text-gray-500">{getSimpleTypeDescription(type)}</span>
            )}
          </div>

          {actionButtons}
        </div>

        {/* Content area */}
        <div className="flex flex-grow flex-col overflow-auto rounded-md">
          {activeTab === 'code' ? (
            <div className="h-full" style={{ minHeight: '500px' }}>
              <Editor
                height="100%"
                value={editorContent}
                onChange={handleEditorChange}
                language={getLanguageFromType(type, language)}
                beforeMount={(monaco: Monaco) => {
                  // Configure Monaco instance before mounting
                  monaco.editor.defineTheme('github-custom', {
                    base: 'vs',
                    inherit: true,
                    rules: [
                      { token: 'comment', foreground: '008000' },
                      { token: 'keyword', foreground: '0000FF' },
                      { token: 'string', foreground: 'A31515' },
                      { token: 'number', foreground: '098658' },
                      { token: 'regexp', foreground: '800000' },
                    ],
                    colors: {
                      'editor.foreground': '#000000',
                      'editor.background': '#ffffff',
                      'editor.selectionBackground': '#b3d4fc',
                      'editor.lineHighlightBackground': '#f5f5f5',
                      'editorCursor.foreground': '#000000',
                      'editorWhitespace.foreground': '#d3d3d3',
                    },
                  });
                }}
                onMount={(editor, monaco) => {
                  // Configure TypeScript and other languages
                  if (monaco.languages.typescript) {
                    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                      target: monaco.languages.typescript.ScriptTarget.Latest,
                      allowNonTsExtensions: true,
                      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                      module: monaco.languages.typescript.ModuleKind.CommonJS,
                      noEmit: true,
                      esModuleInterop: true,
                      jsx: monaco.languages.typescript.JsxEmit.React,
                      reactNamespace: 'React',
                      allowJs: true,
                    });
                  }

                  // Set editor options if needed
                  editor.updateOptions({
                    tabSize: 2,
                    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                  });
                }}
                options={{
                  automaticLayout: true,
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbers: 'on',
                  renderLineHighlight: 'all',
                  readOnly: readOnly || isGenerating || canvasReadOnly,
                  scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible',
                  },
                  formatOnPaste: true,
                  formatOnType: true,
                  autoIndent: 'full',
                  colorDecorators: true,
                }}
                theme="github-custom"
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              {language && (
                <div className="w-full h-full">
                  <Renderer
                    content={editorContent}
                    type={type}
                    key={refresh}
                    title={title}
                    language={language}
                    onRequestFix={onRequestFix}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Optimize re-renders by comparing only necessary props
    return (
      prevProps.code === nextProps.code &&
      prevProps.language === nextProps.language &&
      prevProps.title === nextProps.title &&
      prevProps.isGenerating === nextProps.isGenerating &&
      prevProps.activeTab === nextProps.activeTab &&
      prevProps.readOnly === nextProps.readOnly &&
      prevProps.type === nextProps.type
    );
  },
);
