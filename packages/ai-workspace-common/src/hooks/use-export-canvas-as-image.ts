import { useReactFlow } from '@xyflow/react';
import { useCallback, useState } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';

export const useExportCanvasAsImage = () => {
  const { t } = useTranslation();
  const reactFlowInstance = useReactFlow();
  const [isLoading, setIsLoading] = useState(false);

  const exportCanvasAsImage = useCallback(
    async (canvasName = 'canvas') => {
      if (isLoading) return;
      setIsLoading(true);
      try {
        if (!reactFlowInstance) {
          throw new Error('React Flow instance not found');
        }

        // get all nodes in the current view
        const nodes = reactFlowInstance.getNodes();
        if (!nodes?.length) {
          message.warning(t('canvas.export.noNodes'));
          return;
        }

        // ensure all nodes are in the view
        reactFlowInstance.fitView({
          padding: 0.1,
          duration: 200,
          minZoom: 0.1,
          maxZoom: 1,
        });

        // wait for the view to adjust
        await new Promise((resolve) => setTimeout(resolve, 300));

        // get the ReactFlow container
        const reactFlowContainer = document.querySelector('.react-flow');
        if (!reactFlowContainer) {
          throw new Error('React Flow container not found');
        }

        // use html2canvas to create an image
        const canvas = await html2canvas(reactFlowContainer as HTMLElement, {
          backgroundColor: '#EEF4F7',
          scale: 4, // improve the quality of the image
          useCORS: true, // allow cross-origin images
          allowTaint: true, // allow the canvas to be tainted
          logging: false, // disable logging
          imageTimeout: 0, // do not timeout
          foreignObjectRendering: true,
          onclone: (clonedDoc) => {
            // handle the cloned document, ensure all styles are applied correctly
            const clonedContainer = clonedDoc.querySelector('.react-flow');
            if (clonedContainer) {
              if (clonedContainer instanceof HTMLElement) {
                clonedContainer.style.left = '-220px';
              }

              // 隐藏 miniMap，防止其被导出到图片中
              const miniMap = clonedContainer.querySelector('.react-flow__minimap');
              if (miniMap instanceof HTMLElement) {
                miniMap.style.display = 'none';
              }

              // ensure the background elements are visible
              const backgrounds = clonedContainer.querySelectorAll('.react-flow__background');
              for (const bg of backgrounds) {
                if (bg instanceof HTMLElement) {
                  bg.style.opacity = '1';
                }
              }

              // handle potentially problematic images
              const images = clonedContainer.querySelectorAll('img');
              for (const img of images) {
                img.crossOrigin = 'anonymous';
              }
            }
          },
        });

        // convert the canvas to an image
        const dataUrl = canvas.toDataURL('image/png');

        // create a download link
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${canvasName || 'canvas'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        message.success(t('canvas.export.success'));
      } catch (error) {
        console.error('Error exporting canvas as image:', error);
        message.error(t('canvas.export.error'));
      } finally {
        setIsLoading(false);
      }
    },
    [reactFlowInstance, t],
  );

  return { exportCanvasAsImage, isLoading };
};
