import { memo, useCallback, useState, useEffect } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { CustomHandle } from './custom-handle';
import { useNodeHoverEffect } from '@refly-packages/ai-workspace-common/hooks/canvas/use-node-hover';
import { getNodeCommonStyles } from './index';
import { ActionButtons } from './action-buttons';
import { CanvasNode, CommonNodeProps } from './types';
import { GroupActionButtons } from '../group-action-menu/group-action-buttons';
import { nodeActionEmitter } from '@refly-packages/ai-workspace-common/events/nodeActions';
import { createNodeEventName, cleanupNodeEvents } from '@refly-packages/ai-workspace-common/events/nodeActions';
import { useUngroupNodes } from '@refly-packages/ai-workspace-common/hooks/canvas/use-batch-nodes-selection/use-ungroup-nodes';
import { useDeleteNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-delete-node';
import { useReactFlow } from '@xyflow/react';

interface GroupMetadata {
  label?: string;
  width?: number;
  height?: number;
  isTemporary?: boolean;
}

interface GroupData {
  title: string;
  entityId: string;
  metadata?: GroupMetadata;
}

type GroupNodeProps = Omit<NodeProps, 'data'> & {
  data: GroupData;
} & CommonNodeProps;

export const GroupNode = memo(
  ({
    id,
    data,
    selected,
    isPreview = false,
    hideActions = false,
    hideHandles = false,
    onNodeClick,
  }: GroupNodeProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const { handleMouseEnter: onHoverStart, handleMouseLeave: onHoverEnd } = useNodeHoverEffect(id);
    const { ungroupNodes } = useUngroupNodes();
    const { getNodes } = useReactFlow();
    const { deleteNodes, deleteNode } = useDeleteNode();

    useEffect(() => {
      const handleNodeUngroup = () => {
        ungroupNodes(id);
      };

      nodeActionEmitter.on(createNodeEventName(id, 'ungroup'), handleNodeUngroup);

      return () => {
        nodeActionEmitter.off(createNodeEventName(id, 'ungroup'), handleNodeUngroup);
        cleanupNodeEvents(id);
      };
    }, [id, ungroupNodes]);

    const handleMouseEnter = useCallback(() => {
      setIsHovered(true);
      onHoverStart();
    }, [onHoverStart]);

    const handleMouseLeave = useCallback(() => {
      setIsHovered(false);
      onHoverEnd();
    }, [onHoverEnd]);

    const width = data.metadata?.width || 200;
    const height = data.metadata?.height || 100;
    const isTemporary = data.metadata?.isTemporary;

    const handleDelete = useCallback(() => {
      const childNodes = getNodes().filter((node) => {
        const isInGroup = node.parentId === id;
        return isInGroup;
      });

      if (childNodes.length > 0) {
        deleteNodes(
          childNodes.map(
            (node) =>
              ({
                id: node.id,
                type: node.type,
                data: node.data,
                position: node.position,
              }) as CanvasNode,
          ),
          { showMessage: false },
        );
      }

      deleteNode({
        id,
        type: 'group',
        data,
        position: { x: 0, y: 0 },
      });
    }, [id, data, getNodes, deleteNodes, deleteNode]);

    useEffect(() => {
      const handleNodeDelete = () => handleDelete();

      nodeActionEmitter.on(createNodeEventName(id, 'delete'), handleNodeDelete);

      return () => {
        nodeActionEmitter.off(createNodeEventName(id, 'delete'), handleNodeDelete);
        cleanupNodeEvents(id);
      };
    }, [id, handleDelete]);

    return (
      <div
        className="group-node"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onNodeClick}
        style={{
          width: `${width}px`,
          height: `${height}px`,
        }}
      >
        <div
          className="relative h-full rounded-lg"
          style={{
            background: 'transparent',
            border: selected ? '2px dashed #00968F' : '2px dashed rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease',
          }}
        >
          {!isPreview && !hideHandles && (
            <>
              <CustomHandle
                type="target"
                position={Position.Left}
                isConnected={false}
                isNodeHovered={isHovered}
                nodeType="group"
              />
              <CustomHandle
                type="source"
                position={Position.Right}
                isConnected={false}
                isNodeHovered={isHovered}
                nodeType="group"
              />
            </>
          )}

          {!isPreview && !hideActions && (
            <>
              <ActionButtons type="group" nodeId={id} isNodeHovered={isHovered} />
              <GroupActionButtons nodeId={id} isTemporary={isTemporary} isNodeHovered={isHovered} />
            </>
          )}
        </div>
      </div>
    );
  },
);

GroupNode.displayName = 'GroupNode';
