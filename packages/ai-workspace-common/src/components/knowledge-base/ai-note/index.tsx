import StarterKit from '@tiptap/starter-kit';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Markdown } from 'tiptap-markdown';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { Resource } from '@refly/openapi-schema';
import { useLocation, useNavigate } from '@refly-packages/ai-workspace-common/utils/router';

import './index.scss';
import { useCookie } from 'react-use';
import { Button, Message as message } from '@arco-design/web-react';
import { useSearchParams } from 'react-router-dom';
import { IconClockCircle, IconEdit, IconList, IconMenu, IconMore, IconSearch } from '@arco-design/web-react/icon';
import { editorEmitter } from '@refly-packages/ai-workspace-common/utils/event-emitter/editor';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useListenToSelection } from '@refly-packages/ai-workspace-common/hooks/use-listen-to-selection';
// 编辑器组件
import {
  CollabEditorCommand,
  CollabGenAIMenuSwitch,
  CollabGenAIBlockMenu,
} from '@refly-packages/editor-component/advanced-editor';
import { EditorRoot } from '@refly-packages/editor-core/components';
import { useEditor } from '@refly-packages/editor-core/components';
import { EditorContent, type JSONContent, EditorInstance } from '@refly-packages/editor-core/components';
import { ImageResizer, handleCommandNavigation } from '@refly-packages/editor-core/extensions';
import { defaultExtensions } from '@refly-packages/editor-component/extensions';
import { defaultEditorContent } from '@refly-packages/editor-component/data/content';
import { uploadFn } from '@refly-packages/editor-component/image-upload';
import { slashCommand } from '@refly-packages/editor-component/slash-command';
import { HocuspocusProvider } from '@hocuspocus/provider';
import Collaboration from '@tiptap/extension-collaboration';
import { useDebouncedCallback } from 'use-debounce';
import { handleImageDrop, handleImagePaste } from '@refly-packages/editor-core/plugins';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
// 编辑器样式
// 图标
import { AiOutlineWarning, AiOutlineFileWord } from 'react-icons/ai';
import hljs from 'highlight.js';
import { useSearchStore } from '@refly-packages/ai-workspace-common/stores/search';

const wsUrl = 'ws://localhost:1234';

const CollaborativeEditor = ({ resourceDetail, readOnly }: { resourceDetail: Resource; readOnly: boolean }) => {
  const { resourceId, content } = resourceDetail;
  const [collabEnabled, setCollabEnabled] = useState(resourceDetail.collabEnabled);
  const lastCursorPosRef = useRef<number>();
  const [token] = useCookie('_refly_ai_sid');
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const editorRef = useRef<EditorInstance>();
  const [initialContent, setInitialContent] = useState<null | JSONContent>(null);

  // 准备 extensions
  const websocketProvider = useMemo(() => {
    return new HocuspocusProvider({
      url: wsUrl,
      name: resourceId,
      token,
    });
  }, [resourceId]);
  const extensions = [
    ...defaultExtensions,
    slashCommand,
    Collaboration.configure({
      document: websocketProvider.document,
    }),
    CollaborationCursor.configure({
      provider: websocketProvider,
    }),
  ];

  //Apply Codeblock Highlighting on the HTML from editor.getHTML()
  const highlightCodeblocks = (content: string) => {
    const doc = new DOMParser().parseFromString(content, 'text/html');
    doc.querySelectorAll('pre code').forEach((el) => {
      // @ts-ignore
      // https://highlightjs.readthedocs.io/en/latest/api.html?highlight=highlightElement#highlightelement
      hljs.highlightElement(el);
    });
    return new XMLSerializer().serializeToString(doc);
  };

  const debouncedUpdates = useDebouncedCallback(async (editor: EditorInstance) => {
    const json = editor.getJSON();
    knowledgeBaseStore.updateNoteCharsCount(editor.storage.characterCount.words());
    window.localStorage.setItem('html-content', highlightCodeblocks(editor.getHTML()));
    window.localStorage.setItem('novel-content', JSON.stringify(json));
    window.localStorage.setItem('markdown', editor.storage.markdown.getMarkdown());
    knowledgeBaseStore.updateNoteSaveStatus('Saved');
  }, 500);

  useEffect(() => {
    const content = window.localStorage.getItem('novel-content');
    if (content) setInitialContent(JSON.parse(content));
    else setInitialContent(defaultEditorContent);
  }, []);

  useEffect(() => {
    // Update status changes
    websocketProvider.on('status', (event) => {
      knowledgeBaseStore.updateNoteServerStatus(event.status);
    });
  }, []);

  useEffect(() => {
    console.log('trying to set content');
    console.log('editor', editorRef.current);
    if (editorRef.current && !collabEnabled) {
      editorRef.current.commands.setContent(content || '');
      setCollabEnabled(true);
      console.log('collaboration initialized!');
    }

    if (editorRef.current && collabEnabled) {
      editorRef.current.on('blur', () => {
        lastCursorPosRef.current = editorRef.current?.view?.state?.selection?.$head?.pos;
        console.log('cursor position', lastCursorPosRef.current);
      });
    }
  }, [editorRef.current, collabEnabled, content]);
  useEffect(() => {
    editorEmitter.on('insertBlow', (content) => {
      const isFocused = editorRef.current?.isFocused;

      if (isFocused) {
        lastCursorPosRef.current = editorRef.current?.view?.state?.selection?.$head?.pos;
        editorRef.current?.commands?.insertContentAt?.(lastCursorPosRef.current, content);
      } else if (lastCursorPosRef.current) {
        const selection = editorRef.current.view.state.selection;

        editorRef.current
          .chain()
          .focus(lastCursorPosRef.current)
          .insertContentAt(
            {
              from: lastCursorPosRef.current,
              to: lastCursorPosRef.current,
            },
            content,
          )
          .run();
        // editorRef.current?.commands?.focus(lastCursorPosRef.current);
        // editorRef.current?.commands?.insertContentAt?.(lastCursorPosRef.current, content);
      }
    });
  }, []);

  useListenToSelection(`ai-note-editor`, 'note');

  return (
    <div className="editor ai-note-editor">
      <div className="relative w-full h-full max-w-screen-lg">
        <EditorRoot>
          <EditorContent
            initialContent={initialContent}
            extensions={extensions}
            onCreate={({ editor }) => {
              editorRef.current = editor;
              knowledgeBaseStore.updateEditor(editor);
            }}
            editable={!readOnly}
            className="relative w-full h-full max-w-screen-lg border-muted sm:rounded-lg"
            editorProps={{
              handleDOMEvents: {
                keydown: (_view, event) => handleCommandNavigation(event),
              },
              handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
              handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
              attributes: {
                class:
                  'prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full',
              },
            }}
            onUpdate={({ editor }) => {
              console.log('edito json', editor.getJSON());
              debouncedUpdates(editor);
              knowledgeBaseStore.updateNoteSaveStatus('Unsaved');
            }}
            slotAfter={<ImageResizer />}
          >
            <CollabEditorCommand />
            <CollabGenAIMenuSwitch />
            <CollabGenAIBlockMenu />
          </EditorContent>
        </EditorRoot>
      </div>
    </div>
  );
};

export const AINote = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const noteId = searchParams.get('noteId');
  const resourceId = noteId;
  const [resourceDetail, setResourceDetail] = useState<Resource | null>(null);
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const searchStore = useSearchStore();

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
        <div className="knowledge-base-detail-menu knowledge-base-detail-navigation-bar">
          {resourceId && knowledgeBaseStore.noteServerStatus === 'connected' ? (
            <div className="conv-meta" style={{ marginRight: 8 }}>
              <AiOutlineFileWord style={{ color: 'rgba(0, 0, 0, .4)' }} />
              <p className="conv-title" style={{ color: 'rgba(0, 0, 0, .4)' }}>
                共 {knowledgeBaseStore.noteCharsCount} 字
              </p>
            </div>
          ) : null}
          {resourceId && knowledgeBaseStore.noteServerStatus === 'disconnected' ? (
            <div className="conv-meta" style={{ marginRight: 8 }}>
              <AiOutlineWarning style={{ color: 'rgba(0, 0, 0, .4)' }} />
              <p className="conv-title" style={{ color: 'rgba(0, 0, 0, .4)' }}>
                服务已断开
              </p>
            </div>
          ) : null}
          {resourceId && knowledgeBaseStore.noteServerStatus === 'connected' ? (
            <div className="conv-meta" style={{ marginRight: 8 }}>
              <IconClockCircle style={{ color: 'rgba(0, 0, 0, .4)' }} />
              <p className="conv-title" style={{ color: 'rgba(0, 0, 0, .4)' }}>
                {knowledgeBaseStore.noteSaveStatus === 'Saved' ? `笔记已自动保存` : `笔记保存中...`}
              </p>
            </div>
          ) : null}
          <div className="conv-meta">
            <Button
              icon={<IconSearch style={{ fontSize: 12 }} />}
              type="text"
              onClick={() => {
                searchStore.setPages(searchStore.pages.concat('note'));
                searchStore.setIsSearchOpen(true);
              }}
              className={'assist-action-item'}
            ></Button>
          </div>
          <div className="conv-meta">
            <Button
              icon={<IconMore style={{ fontSize: 12 }} />}
              type="text"
              onClick={() => {}}
              className={'assist-action-item'}
            ></Button>
          </div>
        </div>
      </div>
      {/* <Button onClick={() => handleInitEmptyNote()}>添加笔记</Button> */}
      {resourceId ? <CollaborativeEditor resourceDetail={resourceDetail} readOnly={resourceDetail?.readOnly} /> : null}
    </div>
  );
};
