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
import { client, createClient } from '@hey-api/client-fetch';
import { Markdown } from 'tiptap-markdown';
import { Resource as ResourceDetail, getResourceDetail } from '@refly/openapi-schema';

import './index.css';

const wsUrl = 'ws://localhost:1234';
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6Im1yY0Bwb3dlcmZvcm1lci5jb20iLCJpYXQiOjE3MTc1OTg2NzksImV4cCI6MTcxODgwODI3OX0.S11lLWITt-priqn2Zl7CcIBBZdijTZwjVUAClkqlc0I';

createClient({ baseUrl: 'http://localhost:3000/v1' });

client.interceptors.request.use((request) => {
  console.log('intercept request:', request);
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
});

// const content = `<h1>Mac OS X</h1>
// <p>March 2005All the best [hackers](https://paulgraham.com/gba.html) I know are gradually switching to Macs.</p>`;

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
    <div className="editor">
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
    <div className="editor">
      <h1>Collaborative Editor</h1>
      <EditorContent style={{ margin: '1rem', border: '1px solid gray' }} className="editor__content" editor={editor} />
      <div className="editor__footer">
        <div className="editor__name">
          <span>Current document: {resourceId}</span>
        </div>
        <div className="editor__name">
          <span>Connection status: {status}</span>
        </div>
      </div>
    </div>
  );
};

const Resource = ({ resourceId }: { resourceId: string }) => {
  const [resourceDetail, setResourceDetail] = useState<ResourceDetail | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await getResourceDetail({
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

const App = () => {
  const resourceId = location.pathname.slice(1);

  if (!resourceId) {
    return <div>Enter {location.origin}/:resourceId</div>;
  }
  return <Resource resourceId={resourceId} />;
};

export default App;
