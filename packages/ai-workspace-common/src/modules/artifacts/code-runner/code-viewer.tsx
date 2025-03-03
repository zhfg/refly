import { FiRefreshCw, FiDownload, FiCopy, FiCode, FiEye } from 'react-icons/fi';
import { useState } from 'react';
import { Button, Tooltip, Divider } from 'antd';
import CodeRunner from './code-runner-react';
import Editor from '@monaco-editor/react';

export default function CodeViewer({
  code,
  language,
  title,
  isGenerating,
  activeTab,
  onTabChange,
  onClose: _onClose,
  onRequestFix,
}: {
  code: string;
  language: string;
  title: string;
  isGenerating: boolean;
  activeTab: string;
  onTabChange: (v: 'code' | 'preview') => void;
  onClose: () => void;
  onRequestFix: (e: string) => void;
}) {
  const [refresh, setRefresh] = useState(0);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const handleDownload = () => {
    const fileExtension = getFileExtensionForLanguage(language);
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileExtensionForLanguage = (lang: string): string => {
    const extensionMap: Record<string, string> = {
      javascript: 'js',
      typescript: 'tsx',
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
    };

    return extensionMap[lang] || 'txt';
  };

  return (
    <div
      className="flex flex-col h-full border border-gray-200 bg-white"
      style={{ height: '100%' }}
    >
      {/* Top header with main tab navigation */}
      <div className="flex items-center justify-between h-12 border-b border-gray-200 bg-white py-2">
        <div className="flex items-center space-x-3">
          <Button
            type={activeTab === 'preview' ? 'primary' : 'text'}
            icon={<FiEye className="size-4 mr-1" />}
            onClick={() => onTabChange('preview')}
            className={`${activeTab === 'preview' ? 'bg-green-600' : 'text-gray-600'}`}
            size="small"
          >
            Preview
          </Button>

          <Button
            type={activeTab === 'code' ? 'primary' : 'text'}
            icon={<FiCode className="size-4 mr-1" />}
            onClick={() => onTabChange('code')}
            className={`${activeTab === 'code' ? 'bg-green-600' : 'text-gray-600'}`}
            size="small"
          >
            Code
          </Button>
        </div>

        <Tooltip title="Refresh">
          <Button
            type="text"
            icon={<FiRefreshCw className="size-4" />}
            onClick={() => setRefresh((r) => r + 1)}
            disabled={isGenerating}
            size="small"
            className="text-gray-600 hover:text-blue-600"
          />
        </Tooltip>
      </div>

      <Divider className="my-0" style={{ margin: 0, height: '1px' }} />

      {/* Breadcrumb and action buttons */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 bg-white">
        <div className="text-sm text-gray-600">
          <span className="text-gray-500">{language}</span>
        </div>

        <div className="flex items-center space-x-2">
          <Tooltip title="Copy code">
            <Button
              type="text"
              icon={<FiCopy className="size-4" />}
              onClick={handleCopyCode}
              size="small"
              className="text-gray-600 hover:text-blue-600"
            />
          </Tooltip>

          <Tooltip title={`Download as .${getFileExtensionForLanguage(language)}`}>
            <Button
              type="text"
              icon={<FiDownload className="size-4" />}
              onClick={handleDownload}
              size="small"
              className="text-gray-600 hover:text-blue-600"
            />
          </Tooltip>
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-grow flex-col overflow-auto">
        {activeTab === 'code' ? (
          <div className="h-full" style={{ minHeight: '500px' }}>
            <Editor
              height="100%"
              defaultLanguage={getFileExtensionForLanguage(language)}
              defaultValue={code}
              options={{
                automaticLayout: true,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible',
                },
              }}
              theme="github-light"
            />
          </div>
        ) : (
          <div
            className="h-full flex items-center justify-center bg-gray-100"
            style={{ minHeight: '500px' }}
          >
            {language && (
              <div className="w-full h-full p-4">
                <CodeRunner
                  onRequestFix={onRequestFix}
                  code={code}
                  language={language}
                  key={refresh}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
