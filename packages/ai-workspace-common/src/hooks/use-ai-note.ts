// components
import { Avatar, Button, Spin, Message, Dropdown, Menu } from '@arco-design/web-react';

// requests
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useEffect } from 'react';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { editorEmitter } from '@refly-packages/ai-workspace-common/utils/event-emitter/editor';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';

export const useAINote = () => {
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const { jumpToNote } = useKnowledgeBaseJumpNewPath();

  const handleInitEmptyNote = async (content: string) => {
    const res = await getClient().createResource({
      body: {
        resourceType: 'note',
        title: 'New Article',
        data: {},
        content,
      },
    });

    if (!res?.data?.success) {
      Message.error(`创建笔记失败，请重试！`);
    }
    const noteId = res?.data?.data?.resourceId;
    jumpToNote({
      noteId,
    });
    knowledgeBaseStore.updateNotePanelVisible(true);
  };

  useEffect(() => {
    editorEmitter.on('createNewNote', (content: string) => {
      handleInitEmptyNote(content);
    });
  }, []);
};
