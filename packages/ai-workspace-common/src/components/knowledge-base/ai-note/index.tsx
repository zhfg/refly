import { HocuspocusProvider } from '@hocuspocus/provider';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Highlight from '@tiptap/extension-highlight';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Markdown } from 'tiptap-markdown';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { ResourceDetail } from '@refly/openapi-schema';
import { useLocation, useNavigate } from '@refly-packages/ai-workspace-common/utils/router';

import './index.scss';
import { useCookie } from 'react-use';
import { Button, Message as message } from '@arco-design/web-react';
import { useSearchParams } from 'react-router-dom';
import { IconClockCircle, IconEdit, IconList, IconMenu, IconMore, IconSearch } from '@arco-design/web-react/icon';
import { editorEmitter } from '@refly-packages/ai-workspace-common/utils/event-emitter/editor';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useListenToSelection } from '@refly-packages/ai-workspace-common/hooks/use-listen-to-selection';

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
  const lastCursorPosRef = useRef<number>();
  const editorRef = useRef<Editor>();
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
  editorRef.current = useEditor({
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
    console.log('editor', editorRef.current);
    if (editorRef.current && !collabEnabled) {
      editorRef.current.commands.setContent(doc || '');
      setCollabEnabled(true);
      console.log('collaboration initialized!');
    }

    if (editorRef.current && collabEnabled) {
      editorRef.current.on('blur', () => {
        lastCursorPosRef.current = editorRef.current?.view?.state?.selection?.$head?.pos;
        console.log('cursor position', lastCursorPosRef.current);
      });
    }
  }, [editorRef.current, collabEnabled, doc]);
  useEffect(() => {
    editorEmitter.on('insertBlow', (content) => {
      const isFocused = editorRef.current?.isFocused;

      if (isFocused) {
        lastCursorPosRef.current = editorRef.current?.view?.state?.selection?.$head?.pos;
        editorRef.current?.commands?.insertContentAt?.(lastCursorPosRef.current, content);
      } else if (lastCursorPosRef.current) {
        editorRef.current?.commands?.focus(lastCursorPosRef.current);
        editorRef.current?.commands?.insertContentAt?.(lastCursorPosRef.current, content);
      }
    });
  }, []);
  useListenToSelection(`ai-note-editor`, 'note');

  return (
    <div className="editor ai-note-editor">
      <EditorContent className="editor__content" editor={editorRef.current} placeholder="写点东西..." />
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

export const AINote = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const noteId = searchParams.get('noteId');
  const resourceId = noteId;
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

  return (
    <div className="ai-note-container">
      <div className="knowledge-base-detail-header">
        <div className="knowledge-base-detail-navigation-bar">
          <div className="conv-meta">
            <IconEdit style={{ color: 'rgba(0, 0, 0, .6)' }} />
            <p className="conv-title">{resourceDetail?.title || '新笔记'}</p>
          </div>
        </div>
        <div className="knowledge-base-detail-menu">
          <div className="conv-meta" style={{ marginRight: 8 }}>
            <IconClockCircle style={{ color: 'rgba(0, 0, 0, .4)' }} />
            <p className="conv-title" style={{ color: 'rgba(0, 0, 0, .4)' }}>
              笔记已自动保存
            </p>
          </div>
          <div className="conv-meta">
            <Button
              icon={<IconSearch style={{ fontSize: 16 }} />}
              type="text"
              onClick={() => {}}
              className={'assist-action-item'}
            ></Button>
          </div>
          <div className="conv-meta">
            <Button
              icon={<IconList style={{ fontSize: 16 }} />}
              type="text"
              onClick={() => {}}
              className={'assist-action-item'}
            ></Button>
          </div>
          <div className="conv-meta">
            <Button
              icon={<IconMore style={{ fontSize: 16 }} />}
              type="text"
              onClick={() => {}}
              className={'assist-action-item'}
            ></Button>
          </div>
        </div>
      </div>
      {/* <Button onClick={() => handleInitEmptyNote()}>添加笔记</Button> */}
      {resourceId ? (
        resourceDetail.readOnly ? (
          <ReadonlyEditor resourceDetail={resourceDetail} />
        ) : (
          <CollaborativeEditor resourceDetail={resourceDetail} />
        )
      ) : null}
    </div>
  );
};
