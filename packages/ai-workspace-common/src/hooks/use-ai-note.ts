// components
import { Message } from '@arco-design/web-react';

// requests
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { editorEmitter } from '@refly-packages/ai-workspace-common/utils/event-emitter/editor';
import { useJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { useCanvasTabs } from '@refly-packages/ai-workspace-common/hooks/use-canvas-tabs';

export const useAINote = (shouldInitListener = false) => {
  const { t } = useTranslation();
  const canvasStore = useCanvasStoreShallow((state) => ({
    updateNewNoteCreating: state.updateNewCanvasCreating,
    updateNotePanelVisible: state.updateCanvasPanelVisible,
  }));
  const { jumpToCanvas } = useJumpNewPath();
  const { handleAddTab: handleAddCanvasTab } = useCanvasTabs();

  const handleInitEmptyNote = async (content: string) => {
    canvasStore.updateNewNoteCreating(true);

    const res = await getClient().createCanvas({
      body: {
        title: t('knowledgeBase.note.defaultTitle'),
        initialContent: content,
      },
    });

    if (!res?.data?.success) {
      Message.error(t('knowledgeBase.note.createNoteFailed'));
      return;
    }

    canvasStore.updateNewNoteCreating(false);

    const { canvasId, title } = res?.data?.data;
    jumpToCanvas({
      canvasId,
      // @ts-ignore
      projectId: res?.data?.data?.projectId, // TODO: 这里需要补充 canvas 的 projectId
    });
    handleAddCanvasTab({
      title,
      key: canvasId,
      content: content,
      canvasId,
      // @ts-ignore
      projectId: res?.data?.data?.projectId, // TODO: 这里需要补充 canvas 的 projectId
    });
  };

  useEffect(() => {
    if (shouldInitListener) {
      editorEmitter.on('createNewNote', (content: string) => {
        handleInitEmptyNote(content);
      });
    }
  }, [shouldInitListener]);

  return {
    handleInitEmptyNote,
  };
};
