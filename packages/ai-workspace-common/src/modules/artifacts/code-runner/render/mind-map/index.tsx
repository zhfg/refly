import { useState, useRef, useEffect, useCallback } from 'react';
import MindMapViewer from './viewer';
import { ReactFlowProvider } from '@xyflow/react';
import { NodeData } from './types';
import { useThrottledCallback } from 'use-debounce';
import * as yaml from 'js-yaml';

interface MindMapRendererProps {
  content: string;
  width: string;
  height: string;
  readonly?: boolean;
  onChange?: (content: string) => void;
}

export default function MindMapRenderer({
  content,
  width,
  height,
  readonly,
  onChange,
}: MindMapRendererProps) {
  const [parsedData, setParsedData] = useState<NodeData | null>(null);

  // Track the last YAML string to prevent duplicate updates
  const lastYamlString = useRef<string>(content);

  // Throttle mind map updates to prevent too frequent updates
  const handleMindMapChange = useThrottledCallback(
    (updatedData: NodeData) => {
      if (!onChange || readonly) return;

      try {
        // Convert the updated data to a YAML string
        const yamlString = yaml.dump(updatedData, {
          indent: 2,
          lineWidth: -1, // Don't wrap lines
          noRefs: true, // Don't use reference tags
        });

        // Only emit change if the YAML actually changed
        if (yamlString !== lastYamlString.current) {
          lastYamlString.current = yamlString;
          onChange(yamlString);
        }
      } catch (err) {
        console.error('Failed to stringify mind map data to YAML:', err);
      }
    },
    300, // 300ms throttle to prevent rapid updates
    { trailing: true }, // Ensure the last update is processed
  );

  // Memoize the onChange handler to prevent recreating it on every render
  const memoizedOnChange = useCallback(
    (updatedData: NodeData) => {
      handleMindMapChange(updatedData);
    },
    [handleMindMapChange],
  );

  useEffect(() => {
    // Try parsing as YAML
    try {
      const yamlData = yaml.load(content) as NodeData;

      // Basic validation
      if (!yamlData || typeof yamlData !== 'object') {
        console.warn('Invalid YAML data structure');
        return;
      }

      // Ensure minimum required structure
      if (!yamlData.id) {
        yamlData.id = 'root';
      }

      if (!Array.isArray(yamlData.children)) {
        yamlData.children = [];
      }

      if (!yamlData.label && !yamlData.content) {
        yamlData.label = 'Main Topic';
        yamlData.content = 'Main Topic';
      }

      // Only update state if there's an actual change
      if (JSON.stringify(yamlData) !== JSON.stringify(parsedData)) {
        setParsedData(yamlData);
        lastYamlString.current = content;
      }
    } catch (err) {
      console.error('Failed to parse YAML:', err);
      // No need to set parse error - just don't update parsedData
    }
  }, [content]);

  if (!parsedData) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-gray-500 bg-gray-50">
        Invalid mind map data format. Please check your YAML structure.
      </div>
    );
  }

  return (
    <div style={{ width, height }}>
      <ReactFlowProvider>
        <MindMapViewer
          data={parsedData}
          onChange={memoizedOnChange}
          onNodeClick={() => {}} // Empty handler since we don't need this functionality
          readonly={readonly}
        />
      </ReactFlowProvider>
    </div>
  );
}
