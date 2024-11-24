import { Position, NodeProps, useReactFlow } from '@xyflow/react';
import { CanvasNodeData, ResourceNodeMeta } from './types';
import { Node } from '@xyflow/react';
import { FileText, Link2, MoreHorizontal } from 'lucide-react';
import { CustomHandle } from './custom-handle';
import { useState, useCallback } from 'react';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { EDGE_STYLES } from '../constants';

type ResourceNode = Node<CanvasNodeData<ResourceNodeMeta>, 'resource'>;

export const ResourceNode = ({ data, selected, id }: NodeProps<ResourceNode>) => {
  const [isHovered, setIsHovered] = useState(false);
  const { edges } = useCanvasControl();
  const { setEdges } = useReactFlow();
  const ResourceIcon = data?.metadata?.resourceType === 'weblink' ? Link2 : FileText;

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
      <div
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();

          console.log('click');
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
          h-[186px]
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
          <div className="flex items-center gap-2">
            <div
              className="
                w-6 
                h-6 
                rounded 
                bg-[#17B26A] 
                shadow-[0px_2px_4px_-2px_rgba(16,24,60,0.06),0px_4px_8px_-2px_rgba(16,24,60,0.1)]
                flex 
                items-center 
                justify-center
                flex-shrink-0
              "
            >
              <ResourceIcon className="w-4 h-4 text-white" />
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
              {data?.metadata?.resourceType === 'weblink' ? 'Web Link' : 'Plain Text'}
            </span>
          </div>

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
            这是资源的描述文本，如果内容过长会自动截断并显示省略号...
          </div>
        </div>
      </div>
    </div>
  );
};
