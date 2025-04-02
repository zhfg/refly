import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useEdgeStyles } from '../../components/canvas/constants';

export const useNodeHoverEffect = (nodeId: string) => {
  const { setEdges, setNodes } = useReactFlow();
  const edgeStyles = useEdgeStyles();

  const updateNodeAndEdges = useCallback(
    (isHovered: boolean, selected?: boolean) => {
      // Batch update both nodes and edges in a single React state update
      const newZIndex = isHovered ? 1000 : 0;
      const newEdgeStyle = isHovered ? edgeStyles.hover : edgeStyles.default;

      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === nodeId) {
            return node.type === 'group'
              ? { ...node, zIndex: selected ? 1000 : -1 }
              : { ...node, zIndex: newZIndex };
          }
          return node;
        }),
      );

      setEdges((eds) =>
        eds.map((edge) =>
          edge.source === nodeId || edge.target === nodeId
            ? { ...edge, style: newEdgeStyle }
            : edge,
        ),
      );
    },
    [nodeId, setEdges, setNodes, edgeStyles],
  );

  const handleMouseEnter = useCallback(
    (selected?: boolean) => {
      updateNodeAndEdges(true, selected);
    },
    [updateNodeAndEdges],
  );

  const handleMouseLeave = useCallback(
    (selected?: boolean) => {
      updateNodeAndEdges(false, selected);
    },
    [updateNodeAndEdges],
  );

  return {
    handleMouseEnter,
    handleMouseLeave,
  };
};
