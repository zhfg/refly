// components
import { Avatar, Button, Spin, Message, Dropdown, Menu } from '@arco-design/web-react';
// utils
import { useLocation, useNavigate } from '@refly-packages/ai-workspace-common/utils/router';
import { useSearchParams } from 'react-router-dom';
// requests
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useEffect } from 'react';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { editorEmitter } from '@refly-packages/ai-workspace-common/utils/event-emitter/editor';

export const useAINote = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const knowledgeBaseStore = useKnowledgeBaseStore();

  const jumpNewNote = (noteId: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('noteId', noteId);
    setSearchParams(newSearchParams);
    navigate(`/knowledge-base?${newSearchParams.toString()}`);
  };

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
    jumpNewNote(noteId);
    knowledgeBaseStore.updateNotePanelVisible(true);
  };

  useEffect(() => {
    editorEmitter.on('createNewNote', (content: string) => {
      handleInitEmptyNote(content);
    });
  }, []);
};
