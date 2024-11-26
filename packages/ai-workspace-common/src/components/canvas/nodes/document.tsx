import { Position, NodeProps, useReactFlow } from '@xyflow/react';
import { CanvasNodeData, DocumentNodeMeta } from './types';
import { Node } from '@xyflow/react';
import { FileText, MoreHorizontal } from 'lucide-react';
import { CustomHandle } from './custom-handle';
import { useState, useCallback } from 'react';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { EDGE_STYLES } from '../constants';
import { getNodeCommonStyles } from './index';
import { ActionButtons } from './action-buttons';

type DocumentNode = Node<CanvasNodeData<DocumentNodeMeta>, 'document'>;

export const DocumentNode = ({ data, selected, id }: NodeProps<DocumentNode>) => {
  const [isHovered, setIsHovered] = useState(false);
  const { edges, onEdgesChange } = useCanvasControl();
  const { setEdges } = useReactFlow();

  // Check if node has any connections
  const isTargetConnected = edges?.some((edge) => edge.target === id);
  const isSourceConnected = edges?.some((edge) => edge.source === id);

  console.log('isHovered', data);

  // Handle node hover events
  const handleMouseEnter = useCallback(() => {
    console.log('handleMouseEnter', edges, id);
    setIsHovered(true);
    // Update connected edges with hover styles
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
    // Restore default edge styles
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

  const handleAddToContext = useCallback(() => {
    // Implement add to context logic
    console.log('Add to context:', id);
  }, [id]);

  const handleDelete = useCallback(() => {
    // Implement delete logic
    console.log('Delete node:', id);
  }, [id]);

  const handleHelpLink = useCallback(() => {
    // Implement help link logic
    console.log('Open help link');
  }, []);

  const handleAbout = useCallback(() => {
    // Implement about logic
    console.log('Show about info');
  }, []);

  return (
    <div className="relative group" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <ActionButtons
        type="document"
        onAddToContext={handleAddToContext}
        onDelete={handleDelete}
        onHelpLink={handleHelpLink}
        onAbout={handleAbout}
      />

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
          nodeType="document"
        />
        <CustomHandle
          type="source"
          position={Position.Right}
          isConnected={isSourceConnected}
          isNodeHovered={isHovered}
          nodeType="document"
        />

        <div className="flex flex-col gap-2">
          {/* Header with Icon and Type */}
          <div className="flex items-center gap-2">
            <div
              className="
                w-6 
                h-6 
                rounded 
                bg-[#00968F]
                shadow-[0px_2px_4px_-2px_rgba(16,24,60,0.06),0px_4px_8px_-2px_rgba(16,24,60,0.1)]
                flex 
                items-center 
                justify-center
                flex-shrink-0
              "
            >
              <FileText className="w-4 h-4 text-white" />
            </div>

            {/* Node Type */}
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
              Document
            </span>
          </div>

          {/* Document Title */}
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

          {/* Document Content Preview */}
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
            {data.metadata.contentPreview || '暂无内容预览...'}
          </div>
        </div>
      </div>
    </div>
  );
};
