import { Position, NodeProps, useEdges, useReactFlow } from '@xyflow/react';
import { CanvasNodeData, ResponseNodeMeta } from './types';
import { Node } from '@xyflow/react';
import { MessageSquare, MoreHorizontal } from 'lucide-react';
import { useActionResultStoreShallow } from '@refly-packages/ai-workspace-common/stores/action-result';
import { useEffect, useState, useCallback } from 'react';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { CustomHandle } from './custom-handle';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { useEdgeStyles } from '../constants';
import { getNodeCommonStyles } from './index';

type ToolResponseNode = Node<CanvasNodeData<ResponseNodeMeta>, 'toolResponse'>;

export const ToolResponseNode = ({ data, selected, id }: NodeProps<ToolResponseNode>) => {
  const [isHovered, setIsHovered] = useState(false);
  const { edges } = useCanvasControl();
  const { setEdges } = useReactFlow();
  const edgeStyles = useEdgeStyles();

  // Get result from store
  const { result, updateActionResult } = useActionResultStoreShallow((state) => ({
    result: state.resultMap[data.entityId],
    updateActionResult: state.updateActionResult,
  }));

  // Fetch result if not available
  const fetchActionResult = async (resultId: string) => {
    const { data, error } = await getClient().getActionResult({
      query: { resultId },
    });

    if (error || !data?.success) {
      return;
    }

    updateActionResult(resultId, data.data);
  };

  useEffect(() => {
    if (!result && data.entityId) {
      fetchActionResult(data.entityId);
    }
  }, [data.entityId]);

  // Get query and response content from result
  const query = result?.invokeParam?.input?.query ?? 'Loading...';
  const content = result?.content ?? 'Loading response...';
  const modelName = result?.actionMeta?.name ?? 'AI Assistant';

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
            style: edgeStyles.hover,
          };
        }
        return edge;
      }),
    );
  }, [id, setEdges, edgeStyles]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.source === id || edge.target === id) {
          return {
            ...edge,
            style: edgeStyles.default,
          };
        }
        return edge;
      }),
    );
  }, [id, setEdges, edgeStyles]);

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

      {/* Main Card Container */}
      <div
        className={`
          w-[170px]
          h-[186px]
          ${getNodeCommonStyles({ selected, isHovered })}
        `}
      >
        <CustomHandle
          type="target"
          position={Position.Left}
          isConnected={isTargetConnected}
          isNodeHovered={isHovered}
          nodeType="response"
        />
        <CustomHandle
          type="source"
          position={Position.Right}
          isConnected={isSourceConnected}
          isNodeHovered={isHovered}
          nodeType="response"
        />

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
              {modelName}
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
              line-clamp-2
              overflow-hidden
              text-ellipsis
            "
          >
            {query}
          </div>

          {/* Response Content Preview */}
          <div
            className="
              text-[10px]
              leading-3
              text-[rgba(0,0,0,0.8)]
              font-['PingFang_SC']
              line-clamp-3
              overflow-hidden
              text-ellipsis
            "
          >
            {content}
          </div>
        </div>
      </div>
    </div>
  );
};
