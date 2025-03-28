import { useEffect, useState } from 'react';
import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

const DATA_NUM = 6;

export const useHandleSiderData = (initData?: boolean) => {
  const { canvasList, updateCanvasList } = useSiderStoreShallow((state) => ({
    canvasList: state.canvasList,
    updateCanvasList: state.setCanvasList,
  }));

  const [isLoadingCanvas, setIsLoadingCanvas] = useState(false);

  const getCanvasList = async (setLoading?: boolean) => {
    setLoading && setIsLoadingCanvas(true);
    const { data: res, error } = await getClient().listCanvases({
      query: { page: 1, pageSize: DATA_NUM },
    });
    setLoading && setIsLoadingCanvas(false);
    if (error) {
      console.error('getCanvasList error', error);
      return [];
    }
    const canvases = res?.data || [];
    const formattedCanvases = canvases.map((canvas) => ({
      id: canvas.canvasId,
      name: canvas.title,
      updatedAt: canvas.updatedAt,
      type: 'canvas' as const,
    }));
    updateCanvasList(formattedCanvases);
    return formattedCanvases;
  };

  const loadSiderData = async (setLoading?: boolean) => {
    getCanvasList(setLoading);
  };

  useEffect(() => {
    if (initData) {
      loadSiderData(true);
    }
  }, []);

  return { loadSiderData, getCanvasList, canvasList, isLoadingCanvas };
};
