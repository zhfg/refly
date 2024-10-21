// components
import { Message } from '@arco-design/web-react';

// requests
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { editorEmitter } from '@refly-packages/ai-workspace-common/utils/event-emitter/editor';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { useCanvasTabs } from '@refly-packages/ai-workspace-common/hooks/use-note-tabs';

export const useAINote = (shouldInitListener = false) => {
  const { t } = useTranslation();
  const canvasStore = useCanvasStoreShallow((state) => ({
    updateNewNoteCreating: state.updateNewCanvasCreating,
    updateNotePanelVisible: state.updateCanvasPanelVisible,
  }));
  const { jumpToCanvas } = useKnowledgeBaseJumpNewPath();
  const { handleAddTab } = useCanvasTabs();

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
    });
    handleAddTab({
      title,
      key: canvasId,
      content: content,
      canvasId,
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
