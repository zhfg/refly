import { useReactFlow } from '@xyflow/react';
import { useCallback, useState } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import { useSiderStore } from '@refly-packages/ai-workspace-common/stores/sider';

export const useExportCanvasAsImage = () => {
  const { t } = useTranslation();
  const reactFlowInstance = useReactFlow();
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to convert image to base64
  const imageToBase64 = useCallback(async (imgUrl: string): Promise<string> => {
    try {
      const response = await fetch(imgUrl, {
        mode: 'cors',
        credentials: 'include', // Include cookies with the request
      });
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to convert image to base64:', error);
      return imgUrl; // Return original URL if conversion fails
    }
  }, []);

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
        reactFlowInstance.fitView();

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
          onclone: async (clonedDoc) => {
            // handle the cloned document, ensure all styles are applied correctly
            const clonedContainer = clonedDoc.querySelector('.react-flow');
            if (clonedContainer) {
              if (!useSiderStore.getState().collapse) {
                if (clonedContainer instanceof HTMLElement) {
                  clonedContainer.style.left = '-220px';
                }
              }

              // hide miniMap, prevent it from being exported to the image
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

              // handle images: download and convert to base64
              const images = clonedContainer.querySelectorAll('img');
              const imagePromises = Array.from(images).map(async (img) => {
                try {
                  if (img.src && !img.src.startsWith('data:')) {
                    const base64Data = await imageToBase64(img.src);
                    img.src = base64Data;
                  }
                  img.crossOrigin = 'anonymous';
                } catch (error) {
                  console.error('Error processing image:', error);
                }
              });

              // Wait for all image conversions to complete
              await Promise.all(imagePromises);
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
    [reactFlowInstance, t, imageToBase64],
  );

  return { exportCanvasAsImage, isLoading };
};
