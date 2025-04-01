import { useState, useRef, useEffect } from 'react';
import MindMapViewer from './viewer';
import { ReactFlowProvider } from '@xyflow/react';
import { NodeData } from './types';
import { useThrottledCallback } from 'use-debounce';

interface MindMapRendererProps {
  content: string;
  width: string;
  height: string;
  onChange?: (content: string) => void;
}

export default function MindMapRenderer({
  content,
  width,
  height,
  onChange,
}: MindMapRendererProps) {
  const [parsedData, setParsedData] = useState<NodeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track the last JSON string to prevent duplicate updates
  const lastJsonString = useRef<string>(content);

  // Throttle mind map updates to prevent too frequent updates
  const handleMindMapChange = useThrottledCallback(
    (updatedData: NodeData) => {
      if (!onChange) return;

      try {
        // Convert the updated data to a JSON string
        const jsonString = JSON.stringify(updatedData, null, 2);

        // Only emit change if the JSON actually changed
        if (jsonString !== lastJsonString.current) {
          lastJsonString.current = jsonString;
          onChange(jsonString);
        }
      } catch (err) {
        console.error('Failed to stringify mind map data:', err);
        setError('Failed to update JSON data');
      }
    },
    300, // 300ms throttle to prevent rapid updates
    { trailing: true }, // Ensure the last update is processed
  );

  useEffect(() => {
    try {
      const parsedData = JSON.parse(content);
      setParsedData(parsedData);
      setError(null);
    } catch (err) {
      console.error('Failed to parse mind map data:', err);
      setError('Failed to parse mind map data');
    }
  }, [content]);

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!parsedData) {
    return (
      <div className="p-4 text-gray-500">
        Invalid mind map data format. Please check your JSON structure.
      </div>
    );
  }

  return (
    <div style={{ width, height }}>
      <ReactFlowProvider>
        <MindMapViewer
          data={parsedData}
          onChange={handleMindMapChange}
          onNodeClick={() => {}} // Empty handler since we don't need this functionality
        />
      </ReactFlowProvider>
    </div>
  );
}
