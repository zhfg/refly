import { Node } from '@xyflow/react';

export const calculateNodesBoundingBox = (nodes: Node[]) => {
  if (!nodes.length) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  return nodes.reduce(
    (bounds, node) => {
      const width = (node as any).width ?? 200;
      const height = (node as any).height ?? 100;

      return {
        minX: Math.min(bounds.minX, node.position.x),
        maxX: Math.max(bounds.maxX, node.position.x + width),
        minY: Math.min(bounds.minY, node.position.y),
        maxY: Math.max(bounds.maxY, node.position.y + height),
      };
    },
    {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
    },
  );
};
