import React, { createContext, useContext, useEffect, useMemo } from 'react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { IndexeddbPersistence } from 'y-indexeddb';
import { getWsServerOrigin } from '@refly-packages/utils/url';
import { editorEmitter } from '@refly-packages/utils/event-emitter/editor';
import { useDocumentStoreShallow } from '@refly-packages/ai-workspace-common/stores/document';
import { useCollabToken } from '@refly-packages/ai-workspace-common/hooks/use-collab-token';

interface DocumentContextType {
  docId: string;
  ydoc: Y.Doc;
  provider: HocuspocusProvider;
  localProvider: IndexeddbPersistence;
}

const DocumentContext = createContext<DocumentContextType | null>(null);

export const DocumentProvider = ({ docId, children }: { docId: string; children: React.ReactNode }) => {
  const { token, refreshToken } = useCollabToken();

  const { setDocumentLocalSyncedAt, setDocumentRemoteSyncedAt, updateDocument } = useDocumentStoreShallow((state) => ({
    setDocumentLocalSyncedAt: state.setDocumentLocalSyncedAt,
    setDocumentRemoteSyncedAt: state.setDocumentRemoteSyncedAt,
    updateDocument: state.updateDocument,
  }));

  const {
    remote: provider,
    local: localProvider,
    doc,
  } = useMemo(() => {
    const doc = new Y.Doc();

    const remoteProvider = new HocuspocusProvider({
      url: getWsServerOrigin(),
      name: docId,
      token,
      document: doc,
      connect: true,
      onAuthenticationFailed: () => {
        refreshToken();
      },
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

    return { remote: remoteProvider, local: localProvider, doc };
  }, [docId, token]);

  useEffect(() => {
    const ydoc = provider.document;
    if (!ydoc) return;

    const title = ydoc.getText('title');

    const titleObserverCallback = () => {
      updateDocument(docId, { docId, title: title?.toJSON() });
    };

    title.observe(titleObserverCallback);

    return () => {
      title.unobserve(titleObserverCallback);

      if (provider) {
        provider.forceSync();
        provider.destroy();
        localProvider.destroy();
      }
    };
  }, [provider, docId, token, localProvider]);

  // Add null check before rendering
  if (!provider) {
    return null;
  }

  return (
    <DocumentContext.Provider value={{ docId, provider, localProvider, ydoc: doc }}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocumentContext = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocumentContext must be used within a DocumentProvider');
  }
  return context;
};
