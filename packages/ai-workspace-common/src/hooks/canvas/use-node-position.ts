import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

export const useNodePosition = () => {
  const { getNode, setCenter } = useReactFlow();

  const setNodeCenter = useCallback(
    (nodeId: string) => {
      // Center view on new node after it's rendered
      requestAnimationFrame(() => {
        const renderedNode = getNode(nodeId);
        if (renderedNode) {
          setCenter(renderedNode.position.x, renderedNode.position.y, {
            duration: 300,
            zoom: 1,
          });
        }
      });
    },
    [setCenter, getNode],
  );

  return {
    setNodeCenter,
  };
};
