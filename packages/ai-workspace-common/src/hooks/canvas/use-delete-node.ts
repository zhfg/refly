import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';
import { useCanvasStore } from '@refly-packages/ai-workspace-common/stores/canvas';

export const useDeleteNode = () => {
  const { getNode, getEdges, deleteElements } = useReactFlow();
  const { t } = useTranslation();
  const { canvasId } = useCanvasContext();

  return useCallback(
    (id: string) => {
      const node = getNode(id);
      if (!node) return;

      const edges = getEdges();

      deleteElements({
        nodes: [node],
        edges: edges.filter((e) => e.source === node.id || e.target === node.id),
      });

      // Delete from context panel if exists
      const contextStore = useContextPanelStore.getState();
      contextStore.removeContextItem(node.id);

      // Delete node preview from canvas store
      const canvasStore = useCanvasStore.getState();
      canvasStore.removeNodePreview(canvasId, node.id);

      // Get node title based on node type
      const nodeTitle = node.data?.title ?? t('knowledgeBase.context.untitled');

      // Show success message
      message.success(
        t('knowledgeBase.context.deleteSuccessWithTitle', {
          title: nodeTitle,
          type: t(`knowledgeBase.context.nodeTypes.${node.type}`),
        }),
      );
    },
    [getNode, getEdges, deleteElements, t, canvasId],
  );
};
