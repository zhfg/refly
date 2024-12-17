import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
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

const providerCache = new Map<string, HocuspocusProvider>();
const PROVIDER_CLEANUP_DELAY = 5000; // 5 seconds delay before actual cleanup

export const CanvasProvider = ({ canvasId, children }: { canvasId: string; children: React.ReactNode }) => {
  const [token] = useCookie('_refly_ai_sid');

  const provider = useMemo(() => {
    const existingProvider = providerCache.get(canvasId);
    if (existingProvider?.status === 'connected') {
      return existingProvider;
    }

    // If there's a disconnected provider in the cache, destroy it properly first
    if (existingProvider) {
      existingProvider.destroy();
      providerCache.delete(canvasId);
    }

    const newProvider = new HocuspocusProvider({
      url: getWsServerOrigin(),
      name: canvasId,
      token,
      connect: true,
    });

    providerCache.set(canvasId, newProvider);
    return newProvider;
  }, [canvasId, token]);

  const { setNodes, setEdges, setTitle } = useCanvasStoreShallow((state) => ({
    setNodes: state.setNodes,
    setEdges: state.setEdges,
    setTitle: state.setTitle,
  }));

  // Add connection status management
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleConnection = () => {
      if (provider.status !== 'connected' && connectionAttempts < MAX_RETRIES) {
        timeoutId = setTimeout(() => {
          console.log(`Retrying connection attempt ${connectionAttempts + 1}/${MAX_RETRIES}`);
          provider.connect();
          setConnectionAttempts((prev) => prev + 1);
        }, RETRY_DELAY);
      }
    };

    provider.on('status', ({ status }) => {
      if (status === 'connected') {
        setConnectionAttempts(0);
      } else {
        handleConnection();
      }
    });

    return () => {
      clearTimeout(timeoutId);
    };
  }, [provider, connectionAttempts]);

  // Subscribe to yjs document changes
  useEffect(() => {
    const ydoc = provider.document;
    if (!ydoc) return;

    let isDestroyed = false;

    // Get references to the shared types
    const title = ydoc.getText('title');
    const nodesArray = ydoc.getArray<CanvasNode>('nodes');
    const edgesArray = ydoc.getArray<Edge>('edges');

    // Connect handler
    const handleConnect = () => {
      if (isDestroyed) return;

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

      const titleObserverCallback = () => {
        if (provider.status === 'connected') {
          setTitle(canvasId, title.toJSON());
        }
      };

      const nodesObserverCallback = () => {
        if (provider.status === 'connected') {
          const nodes = nodesArray.toJSON();
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

      // Add observers
      title.observe(titleObserverCallback);
      nodesArray.observe(nodesObserverCallback);
      edgesArray.observe(edgesObserverCallback);

      // Store cleanup functions
      return () => {
        title.unobserve(titleObserverCallback);
        nodesArray.unobserve(nodesObserverCallback);
        edgesArray.unobserve(edgesObserverCallback);
      };
    };

    const cleanup = handleConnect();
    provider.on('connect', handleConnect);

    return () => {
      isDestroyed = true;
      cleanup?.(); // Clean up observers
      provider.off('connect', handleConnect);

      // Delay the provider cleanup to avoid too fast creation and destruction
      setTimeout(() => {
        if (providerCache.get(canvasId) === provider) {
          if (provider.status === 'connected') {
            provider.forceSync();
          }
          provider.destroy();
          providerCache.delete(canvasId);
        }
      }, PROVIDER_CLEANUP_DELAY);
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
