import { FC } from 'react';
import { Button } from 'antd';
import {
  FileText,
  Link2,
  MessageSquare,
  Sparkles,
  Wrench,
  Pin,
  Maximize2,
  MoreHorizontal,
  X,
  Cpu,
  Code2,
  Globe,
} from 'lucide-react';
import { CanvasNodeType } from '@refly/openapi-schema';
import { CanvasNode } from '../nodes/types';

// Define background colors for different node types
const NODE_COLORS: Record<CanvasNodeType, string> = {
  document: '#00968F',
  resource: '#17B26A',
  response: '#F79009',
  skill: '#6172F3',
  tool: '#2E90FA',
};

// Get icon component based on node type and metadata
const getNodeIcon = (node: CanvasNode<any>) => {
  switch (node.type) {
    case 'document':
      return FileText;
    case 'resource':
      return node.data?.metadata?.resourceType === 'weblink' ? Link2 : FileText;
    case 'response':
      return MessageSquare;
    case 'skill':
      switch (node.data?.metadata?.skillType) {
        case 'prompt':
        case 'prompt-struct':
          return Cpu;
        case 'code':
          return Code2;
        case 'http':
          return Globe;
        default:
          return Sparkles;
      }
    case 'tool':
      return Wrench;
    default:
      return FileText;
  }
};

// Get node title based on node type and metadata
const getNodeTitle = (node: CanvasNode<any>) => {
  switch (node.type) {
    case 'document':
      return 'Document';
    case 'resource':
      return node.data?.metadata?.resourceType === 'weblink' ? 'Web Link' : 'Plain Text';
    case 'response':
      return node.data?.metadata?.modelName ?? 'AI Response';
    case 'skill':
      const skillType = node.data?.metadata?.skillType;
      switch (skillType) {
        case 'prompt':
          return 'Prompt';
        case 'prompt-struct':
          return 'Structured Prompt';
        case 'code':
          return 'Code';
        case 'http':
          return 'HTTP Request';
        default:
          return skillType ?? 'Skill';
      }
    case 'tool':
      const toolType = node.data?.metadata?.toolType;
      if (!toolType) return 'Unknown Tool';
      const toolTitles: Record<string, string> = {
        TextToSpeech: 'Text To Speech',
        SpeechToText: 'Speech To Text',
        CodeInterpreter: 'Code Interpreter',
        WebSearch: 'Web Search',
      };
      return toolTitles[toolType] ?? toolType.split(/(?=[A-Z])/).join(' ');
    default:
      return 'Unknown Node';
  }
};

interface NodePreviewHeaderProps {
  node: CanvasNode<any>;
  onClose: () => void;
  onPin?: () => void;
  onMaximize?: () => void;
  isPinned?: boolean;
  isMaximized?: boolean;
}

export const NodePreviewHeader: FC<NodePreviewHeaderProps> = ({
  node,
  onClose,
  onPin,
  onMaximize,
  isPinned = false,
  isMaximized = false,
}) => {
  const IconComponent = getNodeIcon(node);
  const nodeColor = NODE_COLORS[node.type];
  const nodeTitle = getNodeTitle(node);

  return (
    <div className="flex justify-between items-center p-4 border-b border-[#EAECF0]">
      {/* Left: Icon and Title */}
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: nodeColor }}
        >
          <IconComponent className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-semibold text-gray-900">{nodeTitle}</span>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-1">
        {onPin && (
          <Button
            type="text"
            className={`p-1.5 hover:bg-gray-100 ${isPinned ? 'text-blue-600' : 'text-gray-500'}`}
            onClick={onPin}
          >
            <Pin className="w-4 h-4" />
          </Button>
        )}
        {onMaximize && (
          <Button
            type="text"
            className={`p-1.5 hover:bg-gray-100 ${isMaximized ? 'text-blue-600' : 'text-gray-500'}`}
            onClick={onMaximize}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        )}
        <Button type="text" className="p-1.5 hover:bg-gray-100 text-gray-500">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
        <Button type="text" className="p-1.5 hover:bg-gray-100 text-gray-500" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
