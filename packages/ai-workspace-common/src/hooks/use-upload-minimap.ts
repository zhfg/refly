import { useState } from 'react';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useExportCanvasAsImage } from '@refly-packages/ai-workspace-common/hooks/use-export-canvas-as-image';
import { useDebouncedCallback } from 'use-debounce';
import { useGetCanvasDetail } from '@refly-packages/ai-workspace-common/queries';
import { useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';

export const useUploadMinimap = (canvasId: string) => {
  const { getMinimap } = useExportCanvasAsImage();
  const isLogin = useUserStoreShallow((state) => state.isLogin);
  const { data, isFetched } = useGetCanvasDetail({ query: { canvasId } }, null, {
    enabled: isLogin,
  });
  const [storageKey, setStorageKey] = useState<string | null>(data?.data?.minimapStorageKey);

  const uploadMinimap = async (image: Blob) => {
    if (!isFetched) return;
    const { data } = await getClient().upload({
      body: {
        file: image,
        storageKey: storageKey,
      },
    });
    return data;
  };

  const handleUpdateCanvasMiniMap = async () => {
    const minimap = await getMinimap();
    if (minimap) {
      const { data, success } = await uploadMinimap(minimap);
      if (success && data?.storageKey && data.storageKey !== storageKey) {
        await getClient().updateCanvas({
          body: { canvasId, minimapStorageKey: data.storageKey },
        });
        setStorageKey(data.storageKey);
      }
    }
  };

  const debouncedHandleUpdateCanvasMiniMap = useDebouncedCallback(handleUpdateCanvasMiniMap, 5000);

  return {
    handleUpdateCanvasMiniMap,
    debouncedHandleUpdateCanvasMiniMap,
  };
};
