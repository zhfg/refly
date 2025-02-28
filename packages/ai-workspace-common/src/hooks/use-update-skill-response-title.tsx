import { useCallback } from 'react';
import { useSetNodeDataByEntity } from '@refly-packages/ai-workspace-common/hooks/canvas/use-set-node-data-by-entity';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';

export const useUpdateSkillResponseTitle = () => {
  const { canvasId } = useCanvasContext();

  const { updateNodePreview, nodePreviews } = useCanvasStoreShallow((state) => ({
    updateNodePreview: state.updateNodePreview,
    nodePreviews: state.config[canvasId]?.nodePreviews || [],
  }));

  const setNodeDataByEntity = useSetNodeDataByEntity();

  const handleTitleUpdateSkillResponse = useCallback(
    (newTitle: string, entityId: string, nodeId: string) => {
      setNodeDataByEntity(
        {
          entityId: entityId,
          type: 'skillResponse',
        },
        {
          title: newTitle,
        },
      );
      const preview = nodePreviews.find((p) => p.id === nodeId);
      if (preview) {
        updateNodePreview(canvasId, {
          ...preview,
          data: {
            ...preview.data,
            title: newTitle,
          },
        });
      }
    },
    [setNodeDataByEntity, updateNodePreview, canvasId],
  );

  return handleTitleUpdateSkillResponse;
};
