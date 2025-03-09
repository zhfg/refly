import { useParams } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Renderer from '@refly-packages/ai-workspace-common/modules/artifacts/code-runner/render';
import { CodeArtifactType } from '@refly-packages/ai-workspace-common/modules/artifacts/code-runner/types';

const code = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400">
  <!-- 背景 -->
  <rect width="800" height="400" fill="#f8f9fa" />
  
  <!-- 标题 -->
  <text x="400" y="40" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" font-weight="bold">投资轮次股权分配对比</text>
  
  <!-- 第一轮 -->
  <g transform="translate(200, 150)">
    <text x="0" y="-90" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" font-weight="bold">第一轮投资</text>
    
    <!-- 第一轮饼图 -->
    <circle cx="0" cy="0" r="80" fill="none" stroke="#ddd" stroke-width="1" />
    
    <!-- 创始人 93% -->
    <path d="M 0 0 L 80 0 A 80 80 0 1 1 -11.2 -79.2 Z" fill="#4285f4" />
    
    <!-- 奇绩创坛 7% -->
    <path d="M 0 0 L -11.2 -79.2 A 80 80 0 0 1 80 0 Z" fill="#fbbc05" />
    
    <!-- 图例 -->
    <g transform="translate(-80, 120)">
      <rect x="0" y="0" width="16" height="16" fill="#4285f4" />
      <text x="24" y="12" font-family="Arial, sans-serif" font-size="14">创始人 (93%)</text>
      
      <rect x="0" y="24" width="16" height="16" fill="#fbbc05" />
      <text x="24" y="36" font-family="Arial, sans-serif" font-size="14">奇绩创坛 (7%)</text>
    </g>
  </g>
  
  <!-- 第二轮 -->
  <g transform="translate(600, 150)">
    <text x="0" y="-90" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" font-weight="bold">第二轮投资</text>
    
    <!-- 第二轮饼图 -->
    <circle cx="0" cy="0" r="80" fill="none" stroke="#ddd" stroke-width="1" />
    
    <!-- 创始人 79.05% -->
    <path d="M 0 0 L 80 0 A 80 80 0 1 1 -44.5 -66.4 Z" fill="#4285f4" />
    
    <!-- 奇绩创坛 5.95% -->
    <path d="M 0 0 L -44.5 -66.4 A 80 80 0 0 1 -24.8 -75.8 Z" fill="#fbbc05" />
    
    <!-- 红杉 15% -->
    <path d="M 0 0 L -24.8 -75.8 A 80 80 0 0 1 80 0 Z" fill="#ea4335" />
    
    <!-- 图例 -->
    <g transform="translate(-80, 120)">
      <rect x="0" y="0" width="16" height="16" fill="#4285f4" />
      <text x="24" y="12" font-family="Arial, sans-serif" font-size="14">创始人 (79.05%)</text>
      
      <rect x="0" y="24" width="16" height="16" fill="#fbbc05" />
      <text x="24" y="36" font-family="Arial, sans-serif" font-size="14">奇绩创坛 (5.95%)</text>
      
      <rect x="0" y="48" width="16" height="16" fill="#ea4335" />
      <text x="24" y="60" font-family="Arial, sans-serif" font-size="14">红杉资本 (15%)</text>
    </g>
  </g>
  
  <!-- 箭头 -->
  <g transform="translate(400, 150)">
    <path d="M -120 0 L 120 0" stroke="#333" stroke-width="2" />
    <path d="M 110 -10 L 120 0 L 110 10" fill="none" stroke="#333" stroke-width="2" />
  </g>
  
  <!-- 投资信息 -->
  <text x="200" y="270" font-family="Arial, sans-serif" font-size="12" text-anchor="middle">奇绩创坛：30万美元</text>
  <text x="600" y="270" font-family="Arial, sans-serif" font-size="12" text-anchor="middle">红杉资本：100万美元</text>
</svg>`;

const ShareCanvasPage = () => {
  const { url = '' } = useParams();
  const [isLoading, setIsLoading] = useState(true);
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
  );
};

export default ShareCanvasPage;
