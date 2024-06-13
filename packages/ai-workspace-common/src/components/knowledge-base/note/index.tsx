import { HocuspocusProvider } from '@hocuspocus/provider';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Highlight from '@tiptap/extension-highlight';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React, { useEffect, useMemo, useState } from 'react';
import { Markdown } from 'tiptap-markdown';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { ResourceDetail } from '@refly/openapi-schema';
import { useLocation, useNavigate } from '@refly-packages/ai-workspace-common/utils/router';

import './index.scss';
import { useCookie } from 'react-use';
import { Button, Message as message } from '@arco-design/web-react';
import { useSearchParams } from 'react-router-dom';

const wsUrl = 'ws://localhost:1234';

const ReadonlyEditor = ({ resourceDetail }: { resourceDetail: ResourceDetail }) => {
  const { doc, resourceId } = resourceDetail;
  const editor = useEditor({
    content: doc,
    editable: false,
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Link,
      Image,
      Highlight,
      TaskList,
      TaskItem,
      Markdown,
    ],
    onUpdate: ({ editor }) => {
      console.log('update', editor.getHTML());
    },
  });

  return (
    <div className="editor ai-note-editor">
      <h1>Readonly Editor</h1>
      <EditorContent style={{ margin: '1rem', border: '1px solid gray' }} className="editor__content" editor={editor} />
      <div className="editor__footer">
        <div className="editor__name">
          <span>Current document: {resourceId}</span>
        </div>
      </div>
    </div>
  );
};

const CollaborativeEditor = ({ resourceDetail }: { resourceDetail: ResourceDetail }) => {
  const { resourceId, doc } = resourceDetail;
  const [collabEnabled, setCollabEnabled] = useState(resourceDetail.collabEnabled);
  const [status, setStatus] = useState('disconnected');
  const [token] = useCookie('_refly_ai_sid');

  useEffect(() => {
    // Update status changes
    websocketProvider.on('status', (event) => {
      setStatus(event.status);
    });
  }, []);

  const websocketProvider = useMemo(() => {
    return new HocuspocusProvider({
      url: wsUrl,
      name: resourceId,
      token,
    });
  }, [resourceId]);

  // eslint-disable-next-line
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Link,
      Image,
      Highlight,
      TaskList,
      TaskItem,
      Markdown,
      Collaboration.configure({
        document: websocketProvider.document,
      }),
      CollaborationCursor.configure({
        provider: websocketProvider,
      }),
    ],
    onUpdate: ({ editor }) => {
      console.log('update', editor.getJSON());
    },
  });

  useEffect(() => {
    console.log('trying to set content');
    console.log('editor', editor);
    if (editor && !collabEnabled) {
      editor.commands.setContent(doc || '');
      setCollabEnabled(true);
      console.log('collaboration initialized!');
    }
  }, [editor, collabEnabled, doc]);

  return (
    <div className="editor ai-note-editor">
      <EditorContent className="editor__content" editor={editor} placeholder="写点东西..." />
      {/* <div className="editor__footer">
        <div className="editor__name">
          <span>Current document: {resourceId}</span>
        </div>
        <div className="editor__name">
          <span>Connection status: {status}</span>
        </div>
      </div> */}
    </div>
  );
};

const Resource = ({ resourceId }: { resourceId: string }) => {
  const [resourceDetail, setResourceDetail] = useState<ResourceDetail | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await getClient().getResourceDetail({
        query: { resourceId },
      });
      if (data?.data) {
        setResourceDetail(data?.data);
      }
    };
    fetchData();
  }, [resourceId]);

  if (!resourceDetail) {
    return <p>Loading...</p>;
  }

  return resourceDetail.readOnly ? (
    <ReadonlyEditor resourceDetail={resourceDetail} />
  ) : (
    <CollaborativeEditor resourceDetail={resourceDetail} />
  );
};

export const AINote = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const noteId = searchParams.get('noteId');
  const resourceId = noteId;

  const jumpNewNote = (noteId: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('noteId', noteId);
    setSearchParams(newSearchParams);
    navigate(`/knowledge-base?${newSearchParams.toString()}`);
  };

  const handleInitEmptyNote = async () => {
    const res = await getClient().createResource({
      body: {
        resourceType: 'note',
        title: 'New Article',
        data: {},
        content: '',
      },
    });

    if (!res?.data?.success) {
      message.error(`创建笔记失败，请重试！`);
    }
    const noteId = res?.data?.data?.resourceId;
    jumpNewNote(noteId);
  };

  return (
    <div className="ai-note-container">
      <div className="knowledge-base-detail-header">
        <div className="knowledge-base-detail-navigation-bar"></div>
      </div>
      {/* <Button onClick={() => handleInitEmptyNote()}>添加笔记</Button> */}
      {resourceId ? <Resource resourceId={resourceId} /> : null}
    </div>
  );
};
