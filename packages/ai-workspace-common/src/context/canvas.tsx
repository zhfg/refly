import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useCookie } from 'react-use';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { IndexeddbPersistence } from 'y-indexeddb';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes/types';
import { Edge } from '@xyflow/react';
import { getWsServerOrigin } from '@refly-packages/utils/url';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';

interface CanvasContextType {
  canvasId: string;
  provider: HocuspocusProvider;
  localProvider: IndexeddbPersistence;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

const providerCache = new Map<string, { remote: HocuspocusProvider; local: IndexeddbPersistence }>();

const getTitleFromYDoc = (ydoc: Y.Doc) => {
  const title = ydoc.getText('title');
  return title.toJSON();
};

const getNodesFromYDoc = (ydoc: Y.Doc) => {
  const nodesArray = ydoc.getArray<CanvasNode>('nodes');
  const nodes = nodesArray.toJSON();
  const uniqueNodesMap = new Map();
  nodes.forEach((node) => uniqueNodesMap.set(node.id, node));
  return Array.from(uniqueNodesMap.values());
};

const getEdgesFromYDoc = (ydoc: Y.Doc) => {
  const edgesArray = ydoc.getArray<Edge>('edges');
  const edges = edgesArray.toJSON();
  const uniqueEdgesMap = new Map();
  edges.forEach((edge) => uniqueEdgesMap.set(edge.id, edge));
  return Array.from(uniqueEdgesMap.values());
};

export const CanvasProvider = ({ canvasId, children }: { canvasId: string; children: React.ReactNode }) => {
  const [token] = useCookie('_refly_ai_sid');

  const { setCanvasLocalSynced, setCanvasRemoteSynced } = useCanvasStoreShallow((state) => ({
    setCanvasLocalSynced: state.setCanvasLocalSynced,
    setCanvasRemoteSynced: state.setCanvasRemoteSynced,
  }));

  const { setTitle, setNodes, setEdges } = useCanvasStoreShallow((state) => ({
    setTitle: state.setTitle,
    setNodes: state.setNodes,
    setEdges: state.setEdges,
  }));

  const setCanvasDataFromYDoc = (ydoc: Y.Doc) => {
    setTitle(canvasId, getTitleFromYDoc(ydoc));
    setNodes(canvasId, getNodesFromYDoc(ydoc));
    setEdges(canvasId, getEdgesFromYDoc(ydoc));
  };

  const { remote: provider, local: localProvider } = useMemo(() => {
    const existingProvider = providerCache.get(canvasId);
    if (existingProvider?.remote?.status === 'connected') {
      return existingProvider;
    }

    const doc = new Y.Doc();

    const remoteProvider = new HocuspocusProvider({
      url: getWsServerOrigin(),
      name: canvasId,
      token,
      document: doc,
      connect: true,
      forceSyncInterval: 5000,
    });

    remoteProvider.on('synced', () => {
      setCanvasRemoteSynced(canvasId, Date.now());
    });

    const localProvider = new IndexeddbPersistence(canvasId, doc);

    localProvider.on('synced', () => {
      setCanvasDataFromYDoc(doc);
      setCanvasLocalSynced(canvasId, Date.now());
    });

    const providers = { remote: remoteProvider, local: localProvider };

    providerCache.set(canvasId, providers);
    return providers;
  }, [canvasId, token]);

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
        setCanvasDataFromYDoc(ydoc);
      }

      const titleObserverCallback = () => {
        if (provider.status === 'connected') {
          setTitle(canvasId, getTitleFromYDoc(ydoc));
        }
      };

      const nodesObserverCallback = () => {
        if (provider.status === 'connected') {
          setNodes(canvasId, getNodesFromYDoc(ydoc));
        }
      };

      const edgesObserverCallback = () => {
        if (provider.status === 'connected') {
          setEdges(canvasId, getEdgesFromYDoc(ydoc));
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

      // Ensure clean disconnection
      if (provider.status === 'connected') {
        provider.forceSync();
      }

      // Remove from cache and destroy
      providerCache.delete(canvasId);
      provider.destroy();
    };
  }, [provider, canvasId, setNodes, setEdges, setTitle]);

  // Add null check before rendering
  if (!provider) {
    return null;
  }

  return <CanvasContext.Provider value={{ canvasId, provider, localProvider }}>{children}</CanvasContext.Provider>;
};

export const useCanvasContext = () => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvasContext must be used within a CanvasProvider');
  }
  return context;
};
