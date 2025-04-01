import { memo } from 'react';

import HTMLRenderer from './html';
import SVGRender from './svg';
import ReactRenderer from './react';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';
import { CodeArtifactType } from '@refly-packages/ai-workspace-common/modules/artifacts/code-runner/artifact-type-util';
import MindMapViewer from '@refly-packages/ai-workspace-common/components/canvas/node-preview/mind-map/viewer';
import { ReactFlowProvider } from '@xyflow/react';

interface RendererProps {
  content: string;
  type?: CodeArtifactType;
  title?: string;
  language?: string;
  onRequestFix?: (error: string) => void;
  width?: string;
  height?: string;
}

const Renderer = memo<RendererProps>(
  ({ content, type, title, language, onRequestFix, width = '100%', height = '100%' }) => {
    switch (type) {
      case 'application/refly.artifacts.react': {
        return (
          <ReactRenderer
            code={content}
            title={title}
            language={language}
            onRequestFix={onRequestFix}
          />
        );
      }

      case 'image/svg+xml': {
        return <SVGRender content={content} title={title} width={width} height={height} />;
      }

      case 'application/refly.artifacts.mermaid': {
        return <Markdown content={`\`\`\`mermaid\n${content}\n\`\`\``} />;
      }

      case 'text/markdown': {
        return <Markdown content={content} />;
      }

      case 'application/refly.artifacts.code': {
        return <Markdown content={content} />;
      }

      case 'application/refly.artifacts.mindmap': {
        try {
          const parsedData = JSON.parse(content);
          return (
            <div style={{ width, height }}>
              <ReactFlowProvider>
                <MindMapViewer
                  data={parsedData}
                  onNodeClick={(node) => console.log('Node clicked:', node)}
                />
              </ReactFlowProvider>
            </div>
          );
        } catch (error) {
          console.error('Failed to parse mind map data:', error);
          return (
            <div className="p-4 text-red-500">
              Error: Invalid mind map data format. Please check your JSON structure.
            </div>
          );
        }
      }

      case 'text/html': {
        return <HTMLRenderer htmlContent={content} width={width} height={height} />;
      }

      default: {
        // Default to HTML renderer for unknown types
        return <HTMLRenderer htmlContent={content} width={width} height={height} />;
      }
    }
  },
);

export default Renderer;
