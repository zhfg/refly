import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useCookie } from 'react-use';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { IndexeddbPersistence } from 'y-indexeddb';
import { getWsServerOrigin } from '@refly-packages/utils/url';
import { editorEmitter } from '@refly-packages/utils/event-emitter/editor';
import { useDocumentStoreShallow } from '@refly-packages/ai-workspace-common/stores/document';

interface DocumentContextType {
  docId: string;
  provider: HocuspocusProvider;
  localProvider: IndexeddbPersistence;
}

const DocumentContext = createContext<DocumentContextType | null>(null);

// Add provider cache similar to canvas context
const providerCache = new Map<string, { remote: HocuspocusProvider; local: IndexeddbPersistence }>();

export const DocumentProvider = ({ docId, children }: { docId: string; children: React.ReactNode }) => {
  const [token] = useCookie('_refly_ai_sid');
  const { setDocumentLocalSyncedAt, setDocumentRemoteSyncedAt } = useDocumentStoreShallow((state) => ({
    setDocumentLocalSyncedAt: state.setDocumentLocalSyncedAt,
    setDocumentRemoteSyncedAt: state.setDocumentRemoteSyncedAt,
  }));

  const { remote: provider, local: localProvider } = useMemo(() => {
    // Check cache first
    const existingProvider = providerCache.get(docId);
    if (existingProvider?.remote?.status === 'connected') {
      return existingProvider;
    }

    // Create new Y.Doc and providers
    const doc = new Y.Doc();

    const remoteProvider = new HocuspocusProvider({
      url: getWsServerOrigin(),
      name: docId,
      token,
      document: doc,
      connect: true,
      forceSyncInterval: 5000,
    });

    remoteProvider.on('synced', () => {
      setDocumentRemoteSyncedAt(docId, Date.now());
      editorEmitter.emit('editorSynced');
    });

    // Add local provider
    const localProvider = new IndexeddbPersistence(docId, doc);

    localProvider.on('synced', () => {
      setDocumentLocalSyncedAt(docId, Date.now());
    });

    const providers = { remote: remoteProvider, local: localProvider };
    providerCache.set(docId, providers);
    return providers;
  }, [docId, token]);

  useEffect(() => {
    return () => {
      if (provider) {
        provider.forceSync();
        // Clean up providers
        providerCache.delete(docId);
        provider.destroy();
        localProvider.destroy();
      }
    };
  }, [docId, token, provider, localProvider]);

  // Add null check before rendering
  if (!provider) {
    return null;
  }

  return <DocumentContext.Provider value={{ docId, provider, localProvider }}>{children}</DocumentContext.Provider>;
};

export const useDocumentContext = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocumentContext must be used within a DocumentProvider');
  }
  return context;
};
