import { useCallback } from 'react';
import { useCanvasStore } from '../stores/canvas';
import { CanvasNodeFilter } from './use-canvas-control';
import { CanvasNode } from '../components/canvas/nodes';

export const useNodeSelection = (canvasId: string) => {
  const setNodes = useCanvasStore((state) => state.setNodes);

  const setSelectedNodeByEntity = useCallback(
    (filter: CanvasNodeFilter) => {
      const { type, entityId } = filter;
      const { data } = useCanvasStore.getState();
      const nodes = data[canvasId]?.nodes ?? [];

      // 只更新选中状态，不触发其他更新
      const updatedNodes = nodes.map((n) => ({
        ...n,
        selected: n.type === type && n.data?.entityId === entityId,
      }));

      setNodes(canvasId, updatedNodes);
    },
    [canvasId, setNodes],
  );

  return {
    setSelectedNodeByEntity,
  };
};
