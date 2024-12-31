import { FC, memo, useState, useMemo } from 'react';
import { NodeActionMenu } from '../node-action-menu';
import { CanvasNodeType } from '@refly/openapi-schema';
import { useReactFlow } from '@xyflow/react';
import { CanvasNode } from './index';

type ActionButtonsProps = {
  nodeId: string;
  type: CanvasNodeType;
  isNodeHovered: boolean;
  isTemporaryGroup: boolean;
};

export const ActionButtons: FC<ActionButtonsProps> = memo(
  ({ nodeId, type, isNodeHovered, isTemporaryGroup }) => {
    const [isMenuHovered, setIsMenuHovered] = useState(false);
    const { getNode } = useReactFlow();

    // 获取节点数据，检查是否为临时组
    const node = useMemo(() => getNode(nodeId) as CanvasNode, [nodeId, getNode]);

    // 如果是临时组或者节点被hover，显示操作按钮
    const shouldShowMenu = isTemporaryGroup || isNodeHovered || isMenuHovered;

    return (
      <>
        <div
          className={`
            absolute
            -right-[30px]
            top-0
            w-[30px]
            h-full
            ${shouldShowMenu ? '' : 'pointer-events-none'}
          `}
          onMouseEnter={() => setIsMenuHovered(true)}
          onMouseLeave={() => setIsMenuHovered(false)}
        />
        <div
          className={`
            absolute
            -right-[154px]
            top-0
            transition-opacity
            duration-200
            ease-in-out
            z-50
            w-[150px]
            bg-white
            rounded-lg
            ${shouldShowMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
          onMouseEnter={() => setIsMenuHovered(true)}
          onMouseLeave={() => setIsMenuHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <NodeActionMenu nodeId={nodeId} nodeType={type} />
        </div>
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.nodeId === nextProps.nodeId &&
      prevProps.type === nextProps.type &&
      prevProps.isNodeHovered === nextProps.isNodeHovered
    );
  },
);

ActionButtons.displayName = 'ActionButtons';
