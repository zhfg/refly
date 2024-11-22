import { Handle, NodeProps, Position } from '@xyflow/react';
import { CanvasNodeData, ResourceNodeMeta } from './types';
import { Node } from '@xyflow/react';
import { FileText, Link2, MoreHorizontal } from 'lucide-react';

type ResourceNode = Node<CanvasNodeData<ResourceNodeMeta>, 'resource'>;

export const ResourceNode = ({ data, selected }: NodeProps<ResourceNode>) => {
  const ResourceIcon = data.metadata.resourceType === 'weblink' ? Link2 : FileText;

  return (
    <div className="relative group">
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
        <Handle type="target" position={Position.Left} className="w-3 h-3 -ml-1.5" />
        <Handle type="source" position={Position.Right} className="w-3 h-3 -mr-1.5" />

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
              {data.metadata.resourceType === 'weblink' ? 'Web Link' : 'Plain Text'}
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
            {data.entityId}
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
