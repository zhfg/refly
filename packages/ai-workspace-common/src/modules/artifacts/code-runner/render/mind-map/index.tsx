import MindMapViewer from './viewer';
import { ReactFlowProvider } from '@xyflow/react';

export default function MindMapRenderer({
  content,
  width,
  height,
}: { content: string; width: string; height: string }) {
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
