import { useCallback, useEffect, useState } from 'react';
import { Node, useNodes, useViewport } from '@xyflow/react';
import { calculateNodesBoundingBox } from '../../components/canvas/multi-selection-menu/utils';

export interface MenuPosition {
  x: number;
  y: number;
}

export interface SelectionMenuPositions {
  topMenu: MenuPosition;
  rightMenu: MenuPosition;
}

export const useSelectionMenuPosition = () => {
  const [menuPositions, setMenuPositions] = useState<SelectionMenuPositions>({
    topMenu: { x: 0, y: 0 },
    rightMenu: { x: 0, y: 0 },
  });
  const viewport = useViewport();

  const calculateMenuPositions = useCallback(
    (nodes: Node[]) => {
      const selectedNodes = nodes?.filter((node) => node.selected);
      if (selectedNodes.length < 2) return;

      const { minX, maxX, minY, maxY } = calculateNodesBoundingBox(selectedNodes);
      const centerX = (minX + maxX) / 2;
      const rightX = maxX;
      const centerY = minY;

      // Convert flow coordinates to screen coordinates
      const topScreenPos = {
        x: centerX * viewport.zoom + viewport.x,
        y: (centerY - 60) * viewport.zoom + viewport.y, // Offset above selection
      };

      const rightScreenPos = {
        x: (rightX + 30) * viewport.zoom + viewport.x, // Offset to the right
        y: ((minY + maxY) / 2) * viewport.zoom + viewport.y,
      };

      setMenuPositions({
        topMenu: topScreenPos,
        rightMenu: rightScreenPos,
      });
    },
    [viewport],
  );

  return {
    menuPositions,
    calculateMenuPositions,
  };
};
