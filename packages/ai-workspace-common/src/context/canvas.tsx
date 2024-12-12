import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useCookie } from 'react-use';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes/types';
import { Edge } from '@xyflow/react';
import { getWsServerOrigin } from '@refly-packages/utils/url';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';

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

  console.log('provider', provider.status);

  const { setNodes, setEdges, setTitle } = useCanvasStoreShallow((state) => ({
    setNodes: state.setNodes,
    setEdges: state.setEdges,
    setTitle: state.setTitle,
  }));

  // Subscribe to yjs document changes
  useEffect(() => {
    const ydoc = provider?.document;

    if (!ydoc) return;

    const title = ydoc.getText('title');
    const nodesArray = ydoc.getArray<CanvasNode>('nodes');
    const edgesArray = ydoc.getArray<Edge>('edges');

    // 立即设置初始数据
    if (provider.status === 'connected') {
      setTitle(canvasId, title.toJSON());

      const initialNodes = nodesArray.toJSON();
      const uniqueNodesMap = new Map();
      initialNodes.forEach((node) => uniqueNodesMap.set(node.id, node));
      setNodes(canvasId, Array.from(uniqueNodesMap.values()));

      const initialEdges = edgesArray.toJSON();
      const uniqueEdgesMap = new Map();
      initialEdges.forEach((edge) => uniqueEdgesMap.set(edge.id, edge));
      setEdges(canvasId, Array.from(uniqueEdgesMap.values()));
    }

    // 设置观察者回调
    const titleObserverCallback = () => {
      if (provider.status === 'connected') {
        setTitle(canvasId, title.toJSON());
      }
    };

    const nodesObserverCallback = () => {
      if (provider.status === 'connected') {
        const nodes = nodesArray.toJSON();
        console.log('nodes', nodes);
        const uniqueNodesMap = new Map();
        nodes.forEach((node) => uniqueNodesMap.set(node.id, node));
        setNodes(canvasId, Array.from(uniqueNodesMap.values()));
      }
    };

    const edgesObserverCallback = () => {
      if (provider.status === 'connected') {
        const edges = edgesArray.toJSON();
        const uniqueEdgesMap = new Map();
        edges.forEach((edge) => uniqueEdgesMap.set(edge.id, edge));
        setEdges(canvasId, Array.from(uniqueEdgesMap.values()));
      }
    };

    title.observe(titleObserverCallback);
    nodesArray.observe(nodesObserverCallback);
    edgesArray.observe(edgesObserverCallback);

    return () => {
      title.unobserve(titleObserverCallback);
      nodesArray.unobserve(nodesObserverCallback);
      edgesArray.unobserve(edgesObserverCallback);

      provider.forceSync();
      provider.destroy();
    };
  }, [provider, canvasId, setNodes, setEdges, setTitle]);

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
