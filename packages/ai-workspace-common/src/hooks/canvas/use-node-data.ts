import { useCallback } from 'react';
import { useCanvasStore, useCanvasStoreShallow } from '../../stores/canvas';
import { useCanvasContext } from '../../context/canvas';
import { useParams } from 'react-router-dom';
import { CanvasNodeData } from '../../components/canvas/nodes';
import { useCanvasSync } from './use-canvas-sync';

export const useNodeData = () => {
  const { canvasId: contextCanvasId } = useCanvasContext();
  const { canvasId: routeCanvasId } = useParams();
  const { setNodes } = useCanvasStoreShallow((state) => ({
    setNodes: state.setNodes,
  }));

  const { syncNodesToYDoc } = useCanvasSync();

  const setNodeData = useCallback(
    <T = any>(nodeId: string, nodeData: Partial<CanvasNodeData<T>>, selectedCanvasId?: string) => {
      const { data } = useCanvasStore.getState();

      const canvasId = selectedCanvasId ?? contextCanvasId ?? routeCanvasId;
      const currentNodes = data[canvasId]?.nodes ?? [];
      const updatedNodes = currentNodes.map((n) => ({
        ...n,
        data: n.id === nodeId ? { ...n.data, ...nodeData } : n.data,
      }));
      setNodes(canvasId, updatedNodes);
      syncNodesToYDoc(updatedNodes);
    },
    [contextCanvasId, routeCanvasId, setNodes, syncNodesToYDoc],
  );

  return {
    setNodeData,
  };
};
