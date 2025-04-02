import { useState, useRef, useEffect } from 'react';
import MindMapViewer from './viewer';
import { ReactFlowProvider } from '@xyflow/react';
import { NodeData } from './types';
import { useThrottledCallback } from 'use-debounce';
import { fixIncompleteJson } from '@refly-packages/utils/json-repair';
import { jsonrepair } from 'jsonrepair';
import * as yaml from 'js-yaml';

// Function to extract YAML content and repair it if needed
function extractAndRepairYaml(content: string): string {
  // Clean up any potential code block markers
  let cleanContent = content;

  // Remove YAML code blocks if present
  if (cleanContent.trim().startsWith('```yaml') || cleanContent.trim().startsWith('```yml')) {
    cleanContent = cleanContent.replace(/```ya?ml\s*\n/, '').replace(/\n```\s*$/, '');
  }

  // Check if the YAML is incomplete (missing content, etc.)
  let repaired = cleanContent;

  // Basic structure validation and repair
  if (!repaired.includes('id:')) {
    repaired = `id: root\n${repaired}`;
  }

  if (!repaired.includes('children:')) {
    repaired += '\nchildren: []';
  }

  return repaired;
}

// Function to validate mind map data structure
function validateMindMapData(data: unknown): boolean {
  if (!data) return false;

  // Type guard for NodeData structure
  const nodeData = data as Partial<NodeData>;

  // Root node must have id and children
  if (!nodeData.id || !Array.isArray(nodeData.children)) {
    nodeData.id = 'root';
    nodeData.children = [];
    return true;
  }

  // Content can be empty but must be defined
  if (nodeData.content === undefined && nodeData.label === undefined) {
    nodeData.content = 'Main Topic';
    return true;
  }

  return true;
}

// Default minimal mind map structure
const DEFAULT_MINDMAP: NodeData = {
  id: 'root',
  label: 'Main Topic',
  content: 'Main Topic',
  children: [],
};

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

  // Track the last YAML string to prevent duplicate updates
  const lastYamlString = useRef<string>(content);

  // Throttle mind map updates to prevent too frequent updates
  const handleMindMapChange = useThrottledCallback(
    (updatedData: NodeData) => {
      if (!onChange) return;

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
        setError('Failed to update YAML data');
      }
    },
    300, // 300ms throttle to prevent rapid updates
    { trailing: true }, // Ensure the last update is processed
  );

  useEffect(() => {
    try {
      // Step 1: Try parsing as YAML directly
      let parsedData: NodeData;
      try {
        // First extract and repair the YAML content if needed
        const repairedYaml = extractAndRepairYaml(content);
        // Try to parse the YAML content
        parsedData = yaml.load(repairedYaml) as NodeData;
      } catch (_) {
        console.warn('Failed to parse as YAML, trying JSON fallback');

        // Step 2: If YAML parsing fails, try JSON fallback
        try {
          // Try if it's a JSON string (might happen during transition)
          parsedData = JSON.parse(content) as NodeData;
        } catch (_) {
          // Step 3: Try repairing JSON if direct parsing fails
          try {
            const fixedJson = fixIncompleteJson(content);
            parsedData = JSON.parse(fixedJson) as NodeData;
          } catch (_) {
            // Last resort: use jsonrepair library
            const fullyRepairedJson = jsonrepair(content);
            parsedData = JSON.parse(fullyRepairedJson) as NodeData;
          }
        }
      }

      // Validate the data structure
      if (validateMindMapData(parsedData)) {
        // If only one of content or label is defined, use one for the other
        if (parsedData.content === undefined && parsedData.label) {
          parsedData.content = parsedData.label;
        } else if (parsedData.label === undefined && parsedData.content) {
          parsedData.label = parsedData.content.split('\n')[0]; // Use first line of content as label
        }

        setParsedData(parsedData);
        setError(null);
      } else {
        // console.warn('Invalid mind map data structure:', parsedData);
        setParsedData(DEFAULT_MINDMAP);
        setError('Invalid mind map data structure. Using default structure.');
      }
    } catch (err) {
      console.error('Failed to parse mind map data:', err);
      setError('Failed to parse mind map data');
      setParsedData(DEFAULT_MINDMAP);
    }
  }, [content]);

  if (error) {
    return (
      <div className="flex flex-col p-4">
        <div className="text-amber-500 mb-2">Warning: {error}</div>
        <div className="text-gray-500 text-sm">
          Displaying default or partial mind map structure.
        </div>
        {parsedData && (
          <div style={{ width, height }}>
            <ReactFlowProvider>
              <MindMapViewer
                data={parsedData}
                onChange={handleMindMapChange}
                onNodeClick={() => {}}
              />
            </ReactFlowProvider>
          </div>
        )}
      </div>
    );
  }

  if (!parsedData) {
    return (
      <div className="p-4 text-gray-500">
        Invalid mind map data format. Please check your YAML structure.
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
