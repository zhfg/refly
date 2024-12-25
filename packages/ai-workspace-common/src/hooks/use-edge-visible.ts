import { useCallback } from 'react';
import { useCanvasStore, useCanvasStoreShallow } from '../stores/canvas';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';

export const useEdgeVisible = () => {
  const { showEdges, setShowEdges } = useCanvasStoreShallow((state) => ({
    showEdges: state.showEdges,
    setShowEdges: state.setShowEdges,
  }));
  const { updateAllEdgesStyle } = useCanvasControl();

  const toggleEdgeVisible = useCallback(() => {
    setShowEdges(!showEdges);
    updateAllEdgesStyle(!showEdges);
  }, [showEdges, setShowEdges, updateAllEdgesStyle]);

  return {
    showEdges,
    toggleEdgeVisible,
  };
};
