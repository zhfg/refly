import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useExportCanvasAsImage } from '@refly-packages/ai-workspace-common/hooks/use-export-canvas-as-image';
import { useDebouncedCallback } from 'use-debounce';

export const useUploadMinimap = () => {
  const { getMinimap } = useExportCanvasAsImage();
  const uploadMinimap = async (image: Blob) => {
    const { data } = await getClient().upload({
      body: {
        file: image,
      },
    });
    return data;
  };

  const handleUpdateCanvasMiniMap = useDebouncedCallback(async (canvasId: string) => {
    const minimap = await getMinimap();
    if (minimap) {
      const { data, success } = await uploadMinimap(minimap);
      if (success && data?.storageKey) {
        await getClient().updateCanvas({
          body: { canvasId, minimapStorageKey: data.storageKey },
        });
      }
    }
  }, 5000);

  return {
    handleUpdateCanvasMiniMap,
  };
};
