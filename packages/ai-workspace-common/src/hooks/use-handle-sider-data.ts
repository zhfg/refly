import { useEffect, useState } from 'react';
import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useGetProjectCanvasId } from '@refly-packages/ai-workspace-common/hooks/use-get-project-canvasId';

const DATA_NUM = 6;
const DATA_NUM_CANVAS_FOR_PROJECT = 1000;

export const useHandleSiderData = (initData?: boolean) => {
  const { projectId } = useGetProjectCanvasId();
  const { canvasList, updateCanvasList } = useSiderStoreShallow((state) => ({
    canvasList: state.canvasList,
    updateCanvasList: state.setCanvasList,
  }));

  const [isLoadingCanvas, setIsLoadingCanvas] = useState(false);

  const requestCanvasList = async () => {
    const { data: res, error } = await getClient().listCanvases({
      query: { page: 1, pageSize: projectId ? DATA_NUM_CANVAS_FOR_PROJECT : DATA_NUM, projectId },
    });
    if (error) {
      console.error('getCanvasList error', error);
      return [];
    }
    return res?.data || [];
  };

  const getCanvasList = async (setLoading?: boolean) => {
    setLoading && setIsLoadingCanvas(true);

    const canvases = await requestCanvasList();
    setLoading && setIsLoadingCanvas(false);
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
  }, [projectId]);

  return { loadSiderData, getCanvasList, canvasList, isLoadingCanvas };
};
