import { useParams } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { CodeArtifactType } from '@refly-packages/ai-workspace-common/modules/artifacts/code-runner/types';
import Renderer from '@refly-packages/ai-workspace-common/modules/artifacts/code-runner/render';
import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';
import { SiderPopover } from '@refly-packages/ai-workspace-common/components/sider/popover';
import { AiOutlineMenuUnfold } from 'react-icons/ai';
import { Button } from 'antd';
import { code } from './code';

const ShareCanvasPage = () => {
  const { url = '' } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const { collapse, setCollapse } = useSiderStoreShallow((state) => ({
    collapse: state.collapse,
    setCollapse: state.setCollapse,
  }));
  const [codeData, setCodeData] = useState({
    content: code,
    type: 'text/html' as CodeArtifactType,
    title: 'Shared Code',
    language: 'javascript',
  });

  // Decode and parse the shared code data from URL parameter
  useEffect(() => {
    try {
      if (url) {
        const decodedData = JSON.parse(decodeURIComponent(atob(url)));
        setCodeData({
          content: decodedData?.content ?? '',
          type: decodedData?.type ?? 'text/html',
          title: decodedData?.title ?? 'Shared Code',
          language: decodedData?.language ?? 'javascript',
        });
      }
    } catch (error) {
      console.error('Failed to parse shared code data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  // Memoize the render key to prevent unnecessary re-renders
  const renderKey = useMemo(() => Date.now().toString(), [codeData.content]);

  // Handle error reporting (no-op in read-only view)
  const handleRequestFix = useCallback(() => {}, []);

  if (isLoading) {
    return (
      <div className="flex h-full w-full grow items-center justify-center">
        <div className="text-gray-500">Loading shared code...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full grow relative">
      <div
        className={`absolute h-16 bottom-0 left-0 right-0  box-border flex justify-between items-center py-2 px-4 pr-0 bg-transparent ${
          collapse ? 'w-[calc(100vw-12px)]' : 'w-[calc(100vw-232px)]'
        }`}
      >
        <div className="flex items-center relative z-10">
          {collapse && (
            <SiderPopover>
              <Button
                type="text"
                icon={<AiOutlineMenuUnfold size={16} className="text-gray-500" />}
                onClick={() => {
                  setCollapse(!collapse);
                }}
              />
            </SiderPopover>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex h-full w-full grow items-center justify-center bg-white overflow-hidden">
        {codeData.content ? (
          <div className="w-full h-full">
            <Renderer
              content={codeData.content}
              type={codeData.type}
              key={renderKey}
              title={codeData.title}
              language={codeData.language}
              onRequestFix={handleRequestFix}
            />
          </div>
        ) : (
          <div className="text-gray-500">No code content found to display</div>
        )}
      </div>
    </div>
  );
};

export default ShareCanvasPage;
