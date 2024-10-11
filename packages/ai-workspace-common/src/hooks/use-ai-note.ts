// components
import { Message } from '@arco-design/web-react';

// requests
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { editorEmitter } from '@refly-packages/ai-workspace-common/utils/event-emitter/editor';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { useNoteStore } from '@refly-packages/ai-workspace-common/stores/note';
import { useNoteTabs } from '@refly-packages/ai-workspace-common/hooks/use-note-tabs';

export const useAINote = (shouldInitListener = false) => {
  const { t } = useTranslation();
  const noteStore = useNoteStore((state) => ({
    updateNewNoteCreating: state.updateNewNoteCreating,
    updateNotePanelVisible: state.updateNotePanelVisible,
  }));
  const { jumpToNote } = useKnowledgeBaseJumpNewPath();
  const { handleAddTab } = useNoteTabs();

  const handleInitEmptyNote = async (content: string) => {
    noteStore.updateNewNoteCreating(true);

    const res = await getClient().createNote({
      body: {
        title: t('knowledgeBase.note.defaultTitle'),
        initialContent: content,
      },
    });

    if (!res?.data?.success) {
      Message.error(t('knowledgeBase.note.createNoteFailed'));
      return;
    }

    noteStore.updateNewNoteCreating(false);

    const { noteId, title } = res?.data?.data;
    jumpToNote({
      noteId,
    });
    handleAddTab({
      title,
      key: noteId,
      content: content,
      noteId,
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
