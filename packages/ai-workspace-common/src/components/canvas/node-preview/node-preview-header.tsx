import { FC } from 'react';
import { Button, Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
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
  FilePlus,
  Trash2,
  PinOff,
} from 'lucide-react';
import { CanvasNodeType } from '@refly/openapi-schema';
import { CanvasNode } from '../nodes/types';
import { useAddToContext } from '@refly-packages/ai-workspace-common/hooks/use-add-to-context';
import { useDeleteNode } from '@refly-packages/ai-workspace-common/hooks/use-delete-node';
import { IconCanvas } from '@refly-packages/ai-workspace-common/components/common/icon';
import { HiOutlineDocumentText, HiOutlineSquare3Stack3D } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';

// Define background colors for different node types
const NODE_COLORS: Record<CanvasNodeType, string> = {
  document: '#00968F',
  resource: '#17B26A',
  skillResponse: '#F79009',
  toolResponse: '#F79009',
  skill: '#6172F3',
  tool: '#2E90FA',
};

// Get icon component based on node type and metadata
const getNodeIcon = (node: CanvasNode<any>) => {
  switch (node.type) {
    case 'document':
      return HiOutlineDocumentText;
    case 'resource':
      return node.data?.metadata?.resourceType === 'weblink' ? HiOutlineSquare3Stack3D : HiOutlineSquare3Stack3D;
    case 'skillResponse':
      return IconCanvas;
    case 'toolResponse':
      return IconCanvas;
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
    case 'skillResponse':
      return node.data?.metadata?.modelName ?? 'Skill Response';
    case 'toolResponse':
      return node.data?.metadata?.modelName ?? 'Tool Response';
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
  const { t } = useTranslation();

  // Add hooks for context and delete actions
  const handleAddToContext = useAddToContext(node, node.type);
  const handleDelete = useDeleteNode(node, node.type);

  // Define dropdown menu items
  const menuItems: MenuProps['items'] = [
    {
      key: 'addToContext',
      label: (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <FilePlus className="w-4 h-4 flex-shrink-0" />
          {t('canvas.nodeActions.addToContext')}
        </div>
      ),
      onClick: handleAddToContext,
    },
    {
      key: 'remove',
      label: (
        <div className="flex items-center gap-2 text-red-600 whitespace-nowrap">
          <Trash2 className="w-4 h-4 flex-shrink-0" />
          {t('canvas.nodeActions.delete')}
        </div>
      ),
      onClick: handleDelete,
      className: 'hover:bg-red-50',
    },
  ];

  return (
    <div className="flex justify-between items-center py-2 px-4 border-b border-[#EAECF0]">
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
          <Tooltip title={isPinned ? t('canvas.nodePreview.unpin') : t('canvas.nodePreview.pin')}>
            <Button
              type="text"
              className={`p-1.5 hover:bg-gray-100 ${isPinned ? 'text-primary-600' : 'text-gray-500'}`}
              onClick={onPin}
            >
              {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </Button>
          </Tooltip>
        )}
        {onMaximize && (
          <Button
            type="text"
            className={`p-1.5 hover:bg-gray-100 ${isMaximized ? 'text-primary-600' : 'text-gray-500'}`}
            onClick={onMaximize}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        )}
        <Dropdown
          menu={{ items: menuItems }}
          trigger={['click']}
          placement="bottomRight"
          overlayClassName="min-w-[160px] w-max"
          getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
          dropdownRender={(menu) => (
            <div className="min-w-[160px] bg-white rounded-lg border-[0.5px] border-[rgba(0,0,0,0.03)] shadow-lg">
              {menu}
            </div>
          )}
        >
          <Button type="text" className="p-1.5 hover:bg-gray-100 text-gray-500">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </Dropdown>
        <Button type="text" className="p-1.5 hover:bg-gray-100 text-gray-500" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
