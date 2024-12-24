import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';

export const useCanvasManagement = () => {
  const { provider, localProvider } = useCanvasContext();

  const deleteCanvas = async () => {
    try {
      // Delete from IndexedDB first
      await localProvider.destroy();
      // Then sync with remote
      if (provider.status === 'connected') {
        provider.destroy();
      }
    } catch (error) {
      console.error('Error deleting canvas:', error);
    }
  };

  const updateCanvas = async (updates: any) => {
    try {
      const doc = provider.document;
      if (!doc) return;

      // Apply updates to the shared document
      // Changes will automatically persist to IndexedDB
      // and sync with remote when connected
      // Implementation depends on what you're updating

      // Example for updating title:
      const title = doc.getText('title');
      title.delete(0, title.length);
      title.insert(0, updates.title);
    } catch (error) {
      console.error('Error updating canvas:', error);
    }
  };

  return {
    deleteCanvas,
    updateCanvas,
  };
};
