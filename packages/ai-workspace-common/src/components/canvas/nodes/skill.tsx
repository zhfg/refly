import { Handle, NodeProps, Position, useEdges, useReactFlow } from '@xyflow/react';
import { CanvasNodeData, SkillNodeMeta } from './types';
import { Node } from '@xyflow/react';
import { Sparkles, MoreHorizontal, Cpu, Code2, Globe } from 'lucide-react';
import { CustomHandle } from './custom-handle';
import { useState, useCallback } from 'react';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { EDGE_STYLES } from '../constants';

type SkillNode = Node<CanvasNodeData<SkillNodeMeta>, 'skill'>;

// 根据不同的技能类型返回不同的图标
const getSkillIcon = (skillType: string) => {
  switch (skillType) {
    case 'prompt':
    case 'prompt-struct':
      return Cpu;
    case 'skill':
      return Sparkles;
    case 'code':
      return Code2;
    case 'http':
      return Globe;
    default:
      return Sparkles;
  }
};

// 根据不同的技能类型返回不同的显示名称
const getSkillTitle = (skillType: string) => {
  switch (skillType) {
    case 'prompt':
      return 'Prompt';
    case 'prompt-struct':
      return 'Structured Prompt';
    case 'skill':
      return 'Skill';
    case 'code':
      return 'Code';
    case 'http':
      return 'HTTP Request';
    default:
      return skillType;
  }
};

export const SkillNode = ({ data, selected, id }: NodeProps<SkillNode>) => {
  const [isHovered, setIsHovered] = useState(false);
  const { edges } = useCanvasControl();
  const { setEdges } = useReactFlow();
  const SkillIcon = getSkillIcon(data.metadata.skillType);

  // Check if node has any connections
  const isTargetConnected = edges?.some((edge) => edge.target === id);
  const isSourceConnected = edges?.some((edge) => edge.source === id);

  // Handle node hover events
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.source === id || edge.target === id) {
          return {
            ...edge,
            style: EDGE_STYLES.hover,
          };
        }
        return edge;
      }),
    );
  }, [id, setEdges]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.source === id || edge.target === id) {
          return {
            ...edge,
            style: EDGE_STYLES.default,
          };
        }
        return edge;
      }),
    );
  }, [id, setEdges]);

  return (
    <div className="relative group" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* Action Button */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        className="
          absolute 
          -top-9 
          -right-0
          opacity-0 
          group-hover:opacity-100
          transition-opacity 
          duration-200 
          ease-in-out
          z-50
        "
      >
        <button
          className="
            p-1.5
            rounded-md 
            bg-white
            hover:bg-gray-50
            text-gray-600
            shadow-[0px_1px_2px_0px_rgba(16,24,60,0.05)]
            border border-[#EAECF0]
          "
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      <div
        className={`
        w-[170px]
        h-[71px]
        bg-white 
        rounded-xl
        border border-[#EAECF0]
        shadow-[0px_1px_2px_0px_rgba(16,24,60,0.05)]
        p-3
        ${selected ? 'ring-2 ring-blue-500' : ''}
      `}
      >
        <CustomHandle
          type="target"
          position={Position.Left}
          isConnected={isTargetConnected}
          isNodeHovered={isHovered}
        />
        <CustomHandle
          type="source"
          position={Position.Right}
          isConnected={isSourceConnected}
          isNodeHovered={isHovered}
        />

        <div className="flex flex-col gap-2">
          {/* Header with Icon and Type */}
          <div className="flex items-center gap-2">
            <div
              className="
                w-6 
                h-6 
                rounded 
                bg-[#6172F3]
                shadow-[0px_2px_4px_-2px_rgba(16,24,60,0.06),0px_4px_8px_-2px_rgba(16,24,60,0.1)]
                flex 
                items-center 
                justify-center
                flex-shrink-0
              "
            >
              <SkillIcon className="w-4 h-4 text-white" />
            </div>

            <span
              className="
                text-[13px]
                font-medium
                leading-normal
                text-[rgba(0,0,0,0.8)]
                font-['PingFang_SC']
                truncate
              "
            >
              {getSkillTitle(data.metadata.skillType)}
            </span>
          </div>

          {/* Skill Title */}
          <div
            className="
              text-[13px]
              font-medium
              leading-normal
              text-[rgba(0,0,0,0.8)]
              font-['PingFang_SC']
            "
          >
            {data.title}
          </div>

          {/* Skill Preview Content */}
          <div
            className="
              text-[10px]
              leading-3
              text-[rgba(0,0,0,0.8)]
              font-['PingFang_SC']
              line-clamp-2
              overflow-hidden
              text-ellipsis
            "
          >
            {/* 根据不同类型显示不同的预览内容 */}
            {data?.metadata?.skillType?.startsWith?.('prompt') ? (
              <div className="flex items-center gap-1 text-gray-500">
                <Cpu className="w-3 h-3" />
                <span>GPT-4</span>
              </div>
            ) : data.metadata.skillType === 'skill' ? (
              <div>{data.metadata.query}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
