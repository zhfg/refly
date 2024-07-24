// components
import { Avatar, Button, Spin, Message, Dropdown, Menu } from '@arco-design/web-react';

// requests
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useEffect } from 'react';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { editorEmitter } from '@refly-packages/ai-workspace-common/utils/event-emitter/editor';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';

export const useAINote = (shouldInitListener = false) => {
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const { jumpToNote } = useKnowledgeBaseJumpNewPath();

  const handleInitEmptyNote = async (content: string) => {
    const res = await getClient().createNote({
      body: {
        title: 'New Article',
      },
    });

    if (!res?.data?.success) {
      Message.error(`创建笔记失败，请重试！`);
    }
    const noteId = res?.data?.data?.noteId;
    jumpToNote({
      noteId,
    });
    knowledgeBaseStore.updateNotePanelVisible(true);
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
