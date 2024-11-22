import { Handle, NodeProps, Position } from '@xyflow/react';
import { CanvasNodeData, ResponseNodeMeta } from './types';
import { Node } from '@xyflow/react';
import { MessageSquare, MoreHorizontal } from 'lucide-react';

type ResponseNode = Node<CanvasNodeData<ResponseNodeMeta>, 'response'>;

export const ResponseNode = ({ data, selected }: NodeProps<ResponseNode>) => {
  return (
    <div className="relative group">
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

      {/* Main Card Container */}
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
          {/* Header with Icon and Type */}
          <div className="flex items-center gap-2">
            <div
              className="
                w-6 
                h-6 
                rounded 
                bg-[#F79009]
                shadow-[0px_2px_4px_-2px_rgba(16,24,60,0.06),0px_4px_8px_-2px_rgba(16,24,60,0.1)]
                flex 
                items-center 
                justify-center
                flex-shrink-0
              "
            >
              <MessageSquare className="w-4 h-4 text-white" />
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
              {data.metadata.modelName || 'AI Response'}
            </span>
          </div>

          {/* User Query Title */}
          <div
            className="
              text-[13px]
              font-medium
              leading-normal
              text-[rgba(0,0,0,0.8)]
              font-['PingFang_SC']
              truncate
            "
          >
            {data.entityId}
          </div>

          {/* Response Content Preview */}
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
            {/* 这里可以添加实际的响应内容 */}
            百度开发了文心IRAG（Image based
            RAG），检索增强的文生图技术，用于解决大模型在图片生成上的幻觉问题。iRAG将程度搜索的亿级图片资源跟强大的基础模型能力相结合，可以生成各种超真实的图片...
          </div>
        </div>
      </div>
    </div>
  );
};
