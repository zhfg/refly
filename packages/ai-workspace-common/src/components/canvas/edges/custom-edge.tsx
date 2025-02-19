import { memo } from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';
import { IconDelete } from '@refly-packages/ai-workspace-common/components/common/icon';

export const CustomEdge = memo(
  ({ sourceX, sourceY, targetX, targetY, style, selected }: EdgeProps) => {
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    });

    return (
      <>
        <BaseEdge path={edgePath} style={style} />
        {selected && (
          <foreignObject
            width={20}
            height={20}
            x={labelX - 10}
            y={labelY - 10}
            className="edge-delete-button"
            requiredExtensions="http://www.w3.org/1999/xhtml"
          >
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white border border-gray-200 cursor-pointer hover:bg-gray-50">
              <IconDelete className="w-3 h-3 text-gray-500" />
            </div>
          </foreignObject>
        )}
      </>
    );
  },
);
