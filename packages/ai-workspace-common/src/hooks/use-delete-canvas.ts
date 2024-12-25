import { useState } from 'react';
import { message } from 'antd';
import * as Y from 'yjs';
import { useTranslation } from 'react-i18next';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useDebouncedCallback } from 'use-debounce';
import { useNavigate } from 'react-router-dom';
import { useHandleSiderData } from '@refly-packages/ai-workspace-common/hooks/use-handle-sider-data';
import { useCanvasStore } from '@refly-packages/ai-workspace-common/stores/canvas';
import { IndexeddbPersistence } from 'y-indexeddb';

export const useDeleteCanvas = () => {
  const [isRemoving, setIsRemoving] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getCanvasList, canvasList } = useHandleSiderData();

  const deleteCanvas = async (canvasId: string) => {
    if (isRemoving) return;
    let success = false;
    try {
      setIsRemoving(true);
      const { data } = await getClient().deleteCanvas({
        body: {
          canvasId,
        },
      });

      if (data?.success) {
        success = true;
        message.success(t('canvas.action.deleteSuccess'));

        // Check and remove canvasId from localStorage if matches
        const { currentCanvasId, setCurrentCanvasId, deleteCanvasData } = useCanvasStore.getState();
        if (currentCanvasId === canvasId) {
          setCurrentCanvasId(null);
        }

        deleteCanvasData(canvasId);

        // Clear IndexedDB persistence for the deleted canvas
        const indexedDbProvider = new IndexeddbPersistence(canvasId, new Y.Doc());
        await indexedDbProvider.clearData();
        await indexedDbProvider.destroy();

        getCanvasList();

        if (currentCanvasId === canvasId) {
          const firstCanvas = canvasList?.find((canvas) => canvas.id !== canvasId);
          if (firstCanvas?.id) {
            navigate(`/canvas/${firstCanvas?.id}`, { replace: true });
          } else {
            navigate('/canvas/empty', { replace: true });
          }
        }
      }
    } finally {
      setIsRemoving(false);
    }
    return success;
  };

  const debouncedDeleteCanvas = useDebouncedCallback(
    (canvasId: string) => {
      return deleteCanvas(canvasId);
    },
    300,
    { leading: true },
  );

  return { deleteCanvas: debouncedDeleteCanvas, isRemoving };
};
