import { getNodesBounds, useReactFlow } from '@xyflow/react';
import { useCallback } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { toPng } from 'html-to-image';

export const useExportCanvasAsImage2 = () => {
  const { t } = useTranslation();
  const reactFlowInstance = useReactFlow();

  const exportCanvasAsImage2 = useCallback(
    async (canvasName = 'canvas') => {
      try {
        if (!reactFlowInstance) {
          throw new Error('React Flow instance not found');
        }

        const downloadImage = (dataUrl: string) => {
          const a = document.createElement('a');
          a.setAttribute('download', `${canvasName || 'canvas'}.png`);
          a.setAttribute('href', dataUrl);
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        };

        const nodes = reactFlowInstance.getNodes();
        if (!nodes?.length) {
          message.warning(t('canvas.export.noNodes'));
          return;
        }

        // 确保视图适配所有节点
        reactFlowInstance.fitView({
          padding: 0.2,
          duration: 200,
        });

        // 等待视图调整完成
        await new Promise((resolve) => setTimeout(resolve, 300));

        const reactFlowContainer = document.querySelector('.react-flow');
        if (!reactFlowContainer) {
          throw new Error('React Flow container not found');
        }

        const nodesBounds = getNodesBounds(nodes);
        const padding = 20;
        const imageWidth = Math.max(800, nodesBounds.width + padding * 2);
        const imageHeight = Math.max(600, nodesBounds.height + padding * 2);

        await toPng(reactFlowContainer as HTMLElement, {
          backgroundColor: '#EEF4F7',
          width: imageWidth,
          height: imageHeight,
          quality: 1,
          pixelRatio: 2,
          cacheBust: true,
          includeQueryParams: true,
          skipFonts: true,
          imagePlaceholder:
            'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
          // filter: (node) => {
          //   // 过滤掉 minimap 和其他不需要的元素
          //   const className = node.className ?? '';
          //   return (
          //     !className.includes('react-flow__minimap') &&
          //     !className.includes('react-flow__controls') &&
          //     !className.includes('react-flow__panel')
          //   );
          // },
        }).then(downloadImage);

        message.success(t('canvas.export.success'));
      } catch (error) {
        console.error('Error exporting canvas as image:', error);
        message.error(t('canvas.export.error'));
      }
    },
    [reactFlowInstance, t],
  );

  return { exportCanvasAsImage2 };
};
