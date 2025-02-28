import { FiX, FiRefreshCw } from 'react-icons/fi';
import { useState } from 'react';
import { StickToBottom } from 'use-stick-to-bottom';
import { Button, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import CodeRunner from './code-runner-react';
import SyntaxHighlighter from './syntax-highlighter';

export default function CodeViewer({
  code,
  language,
  title,
  isGenerating,
  activeTab,
  onTabChange,
  onClose,
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
  console.log('code', code, 'language', language, 'title', title, 'isGenerating', isGenerating);

  const layout = ['python', 'ts', 'js', 'javascript', 'typescript'].includes(language)
    ? 'tabbed'
    : 'tabbed';

  const [refresh, setRefresh] = useState(0);

  const items: TabsProps['items'] = [
    {
      key: 'code',
      label: 'Code',
      children: (
        <StickToBottom
          className="relative grow overflow-hidden"
          resize="smooth"
          initial={isGenerating ? 'smooth' : false}
        >
          <StickToBottom.Content>
            <SyntaxHighlighter code={code} language={language} />
          </StickToBottom.Content>
        </StickToBottom>
      ),
    },
    {
      key: 'preview',
      label: 'Preview',
      children: (
        <div className="flex h-full items-center justify-center min-h-[300px]">
          {language && (
            <CodeRunner onRequestFix={onRequestFix} code={code} language={language} key={refresh} />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full border border-gray-200">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-300 px-4">
        <div className="inline-flex items-center gap-4">
          <Button
            type="text"
            icon={<FiX className="size-5" />}
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          />
          <span>{title}</span>
        </div>
      </div>

      <div className="flex grow flex-col overflow-y-auto bg-white">
        {layout === 'tabbed' ? (
          <Tabs
            activeKey={activeTab}
            onChange={(key) => onTabChange(key as 'code' | 'preview')}
            items={items}
            className="w-full h-full"
            style={{ height: '100%' }}
          />
        ) : (
          <div className="flex grow flex-col bg-white">
            <div className="h-1/2 overflow-y-auto">
              <SyntaxHighlighter code={code} language={language} />
            </div>
            <div className="flex h-1/2 flex-col">
              <div className="border-t border-gray-300 px-4 py-4">Output</div>
              <div className="flex grow items-center justify-center border-t min-h-[300px]">
                {!isGenerating && (
                  <CodeRunner
                    onRequestFix={onRequestFix}
                    code={code}
                    language={language}
                    key={refresh}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-300 px-4 py-4">
        <div className="inline-flex items-center gap-2.5 text-sm">
          <Button
            icon={<FiRefreshCw className="size-3" />}
            onClick={() => setRefresh((r) => r + 1)}
            disabled={isGenerating}
            size="small"
          >
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
