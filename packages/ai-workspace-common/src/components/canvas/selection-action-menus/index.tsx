import { FC, useState } from 'react';
import { Node, useStore } from '@xyflow/react';
import { GroupActionMenu } from '../group-action-menu';
import { NodeActionMenu } from '../node-action-menu';
import { CanvasNode } from '../nodes';

interface SelectionActionMenusProps {
  selectedNodes: Node[];
}

export const SelectionActionMenus: FC<SelectionActionMenusProps> = ({ selectedNodes }) => {
  const [isTopMenuHovered, setIsTopMenuHovered] = useState(false);
  const [isRightMenuHovered, setIsRightMenuHovered] = useState(false);

  // Get transform and nodes from React Flow store
  const transform = useStore((state) => state.transform);
  // 直接从 store 获取实时的节点数据
  const nodes = useStore((state) => state.nodes.filter((node) => node.selected));

  const shouldShowMenus = nodes.length >= 2 || isTopMenuHovered || isRightMenuHovered;

  if (!shouldShowMenus) return null;

  // Calculate bounding box using real-time node positions
  const bbox = nodes.reduce(
    (acc, node) => {
      const nodeLeft = node.position.x;
      const nodeRight = node.position.x + (node.width || 0);
      const nodeTop = node.position.y;
      const nodeBottom = node.position.y + (node.height || 0);

      return {
        left: Math.min(acc.left, nodeLeft),
        right: Math.max(acc.right, nodeRight),
        top: Math.min(acc.top, nodeTop),
        bottom: Math.max(acc.bottom, nodeBottom),
      };
    },
    { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity },
  );

  // Calculate menu positions in flow coordinates
  const centerX = (bbox.left + bbox.right) / 2;
  const rightX = bbox.right;
  const topY = bbox.top;
  const centerY = (bbox.top + bbox.bottom) / 2;

  // Apply flow transform
  const topMenuStyle = {
    transform: `translate(${centerX * transform[2] + transform[0]}px, ${(topY - 60) * transform[2] + transform[1]}px) translate(-50%, 0)`,
    position: 'absolute' as const,
    zIndex: 50,
    transition: 'none',
    willChange: 'transform',
    pointerEvents: 'all',
  };

  const rightMenuStyle = {
    transform: `translate(${(rightX + 30) * transform[2] + transform[0]}px, ${centerY * transform[2] + transform[1]}px)`,
    position: 'absolute' as const,
    zIndex: 50,
    transition: 'none',
    willChange: 'transform',
    pointerEvents: 'all',
  };

  return (
    <>
      <div
        className="react-flow__node-toolbar"
        style={topMenuStyle}
        onMouseEnter={() => setIsTopMenuHovered(true)}
        onMouseLeave={() => setIsTopMenuHovered(false)}
      >
        <GroupActionMenu nodeId={nodes[0]?.id} isTemporary={true} />
      </div>

      <div
        className="react-flow__node-toolbar"
        style={rightMenuStyle}
        onMouseEnter={() => setIsRightMenuHovered(true)}
        onMouseLeave={() => setIsRightMenuHovered(false)}
      >
        <NodeActionMenu nodeId={nodes[0]?.id} nodeType={(nodes[0] as CanvasNode)?.type} isMultiSelection={true} />
      </div>
    </>
  );
};
