import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useCookie } from 'react-use';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes/types';
import { Edge } from 'node_modules/@xyflow/react/dist/esm/types';
import { getWsServerOrigin } from '@refly-packages/utils/url';
import { useCanvasStore, useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';

interface CanvasContextType {
  canvasId: string;
  provider: HocuspocusProvider;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

export const CanvasProvider = ({ canvasId, children }: { canvasId: string; children: React.ReactNode }) => {
  const [token] = useCookie('_refly_ai_sid');

  const provider = useMemo(() => {
    return new HocuspocusProvider({
      url: getWsServerOrigin(),
      name: canvasId,
      token,
    });
  }, [canvasId, token]);

  const { setNodes, setEdges, setNodesSynced, setEdgesSynced } = useCanvasStoreShallow((state) => ({
    setNodes: state.setNodes,
    setEdges: state.setEdges,
    setNodesSynced: state.setNodesSynced,
    setEdgesSynced: state.setEdgesSynced,
  }));

  // Subscribe to yjs document changes
  useEffect(() => {
    const ydoc = provider?.document;
    if (!ydoc) return;

    const nodesArray = ydoc.getArray<CanvasNode>('nodes');
    const edgesArray = ydoc.getArray<Edge>('edges');

    const nodesObserverCallback = () => {
      const { data } = useCanvasStore.getState();
      if (data[canvasId]?.nodesSynced) return;

      setNodes(canvasId, nodesArray.toJSON());
      setNodesSynced(canvasId, true);
      nodesArray.unobserve(nodesObserverCallback);
    };

    const edgesObserverCallback = () => {
      const { data } = useCanvasStore.getState();
      if (data[canvasId]?.edgesSynced) return;

      setEdges(canvasId, edgesArray.toJSON());
      setEdgesSynced(canvasId, true);
      edgesArray.unobserve(edgesObserverCallback);
    };

    nodesArray.observe(nodesObserverCallback);
    edgesArray.observe(edgesObserverCallback);

    return () => {
      setNodesSynced(canvasId, false);
      setEdgesSynced(canvasId, false);

      provider.forceSync();
      provider.destroy();
    };
  }, [provider, canvasId, setNodes, setEdges, setNodesSynced, setEdgesSynced]);

  // Add null check before rendering
  if (!provider) {
    return null;
  }

  return <CanvasContext.Provider value={{ canvasId, provider }}>{children}</CanvasContext.Provider>;
};

export const useCanvasContext = () => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvasContext must be used within a CanvasProvider');
  }
  return context;
};
