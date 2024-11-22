import React, { createContext, useContext, useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { useCookie } from 'react-use';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes/types';
import { Edge } from 'node_modules/@xyflow/react/dist/esm/types';
import { getWsServerOrigin } from '@refly-packages/utils/url';

interface CanvasContextType {
  canvasId: string;
  provider: HocuspocusProvider;
  yNodes: Y.Array<CanvasNode>;
  yEdges: Y.Array<Edge>;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

export const CanvasProvider = ({ canvasId, children }: { canvasId: string; children: React.ReactNode }) => {
  const providerRef = useRef<HocuspocusProvider | null>(null);

  const [token] = useCookie('_refly_ai_sid');

  if (!providerRef.current) {
    providerRef.current = new HocuspocusProvider({
      url: getWsServerOrigin(),
      name: canvasId,
      token,
    });
  }

  const provider = providerRef.current;
  const ydoc = provider.document;
  const yNodes = ydoc.getArray<CanvasNode>('nodes');
  const yEdges = ydoc.getArray<Edge>('edges');

  useEffect(() => {
    return () => {
      if (providerRef.current) {
        providerRef.current.forceSync();
        providerRef.current.destroy();
        providerRef.current = null;
      }
    };
  }, [canvasId]);

  return <CanvasContext.Provider value={{ canvasId, provider, yNodes, yEdges }}>{children}</CanvasContext.Provider>;
};

export const useCanvasContext = () => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvasContext must be used within a CanvasProvider');
  }
  return context;
};
