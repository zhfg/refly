import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useCookie } from 'react-use';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { getWsServerOrigin } from '@refly-packages/utils/url';
import { editorEmitter } from '@refly-packages/utils/event-emitter/editor';
import { useDocumentStoreShallow } from '@refly-packages/ai-workspace-common/stores/document';

interface DocumentContextType {
  docId: string;
  provider: HocuspocusProvider;
}

const DocumentContext = createContext<DocumentContextType | null>(null);

export const DocumentProvider = ({ docId, children }: { docId: string; children: React.ReactNode }) => {
  const [token] = useCookie('_refly_ai_sid');
  const { updateDocumentServerStatus } = useDocumentStoreShallow((state) => ({
    updateDocumentServerStatus: state.updateDocumentServerStatus,
  }));

  const provider = useMemo(() => {
    const provider = new HocuspocusProvider({
      url: getWsServerOrigin(),
      name: docId,
      token,
    });
    provider.on('status', (event) => {
      updateDocumentServerStatus(event.status);
    });

    // Add synced event listener
    provider.on('synced', () => {
      editorEmitter.emit('editorSynced');
    });
    return provider;
  }, [docId, token]);

  useEffect(() => {
    return () => {
      if (provider) {
        provider.forceSync();
        provider.destroy();
      }
    };
  }, [docId, token]);

  // Add null check before rendering
  if (!provider) {
    return null;
  }

  return <DocumentContext.Provider value={{ docId: docId, provider }}>{children}</DocumentContext.Provider>;
};

export const useDocumentContext = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocumentContext must be used within a DocumentProvider');
  }
  return context;
};
