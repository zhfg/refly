import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { Note } from '@refly/openapi-schema';

import './index.scss';
import { useCookie } from 'react-use';
import { Button, Divider, Input, Switch } from '@arco-design/web-react';
import { IconLock, IconUnlock } from '@arco-design/web-react/icon';
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
import { EditorContent, type JSONContent, EditorInstance } from '@refly-packages/editor-core/components';
import { NoteDropdownMenu } from '@refly-packages/ai-workspace-common/components/knowledge-base/note-dropdown-menu';
import { ImageResizer, handleCommandNavigation } from '@refly-packages/editor-core/extensions';
import { defaultExtensions } from '@refly-packages/editor-component/extensions';
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
import { getWsServerOrigin } from '@refly-packages/utils/url';

const CollaborativeEditor = ({ note }: { note: Note }) => {
  const { noteId, content, readOnly } = note;
  const lastCursorPosRef = useRef<number>();
  const [token] = useCookie('_refly_ai_sid');
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const editorRef = useRef<EditorInstance>();
  const [initialContent, setInitialContent] = useState<null | JSONContent>(null);

  // 准备 extensions
  const websocketProvider = useMemo(() => {
    return new HocuspocusProvider({
      url: getWsServerOrigin(),
      name: noteId,
      token,
    });
  }, [noteId]);
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
    // Update status changes
    websocketProvider.on('status', (event) => {
      knowledgeBaseStore.updateNoteServerStatus(event.status);
    });
  }, []);

  useEffect(() => {
    console.log('trying to set content');
    console.log('editor', editorRef.current);
    if (editorRef.current && readOnly) {
      editorRef.current.commands.setContent(content || '');
      console.log('collaboration initialized!');
    }

    if (editorRef.current && !readOnly) {
      editorRef.current.on('blur', () => {
        lastCursorPosRef.current = editorRef.current?.view?.state?.selection?.$head?.pos;
        console.log('cursor position', lastCursorPosRef.current);
      });
    }
  }, [editorRef.current, readOnly, content]);

  useEffect(() => {
    editorEmitter.on('insertBlow', (content) => {
      const isFocused = editorRef.current?.isFocused;

      if (isFocused) {
        lastCursorPosRef.current = editorRef.current?.view?.state?.selection?.$head?.pos;
        editorRef.current?.commands?.insertContentAt?.(lastCursorPosRef.current, content);
      } else if (lastCursorPosRef.current) {
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
      }
    });
  }, []);

  useListenToSelection(`ai-note-editor`, 'note');

  useEffect(() => {
    console.log('editor readonly', readOnly);
    if (editorRef.current) {
      editorRef.current.setOptions({ editable: !readOnly });
    }
  }, [readOnly]);

  return (
    <div className="editor ">
      <div className="w-full h-full max-w-screen-lg">
        <EditorRoot>
          <EditorContent
            initialContent={initialContent}
            extensions={extensions}
            onCreate={({ editor }) => {
              editorRef.current = editor;
              knowledgeBaseStore.updateEditor(editor);
            }}
            editable={!readOnly}
            className="w-full h-full max-w-screen-lg border-muted sm:rounded-lg"
            editorProps={{
              handleDOMEvents: {
                keydown: (_view, event) => handleCommandNavigation(event),
              },
              handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
              handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
              attributes: {
                class: 'prose prose-lg prose-headings:font-title font-default focus:outline-none max-w-full',
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

interface AINoteHeaderProps {
  note: Note;
}

export const AINoteHeader = (props: AINoteHeaderProps) => {
  const { note } = props;
  const [title, setTitle] = useState(note.title);

  const debouncedUpdate = useDebouncedCallback(async (newTitle: string) => {
    const res = await getClient().updateNote({
      body: {
        noteId: note.noteId,
        title: newTitle,
      },
    });
    if (res.error) {
      console.error(res.error);
      return;
    }
  }, 1000);

  useEffect(() => {
    debouncedUpdate(title);
  }, [title, debouncedUpdate]);

  return (
    <div className="mx-4 mt-8 flex justify-center align-middle">
      <div className="w-full h-full max-w-screen-lg">
        <Input
          className="bg-transparent text-3xl font-bold focus:border-transparent focus:bg-transparent"
          placeholder="Enter The Title"
          value={title}
          onChange={(val) => setTitle(val)}
        />
      </div>
    </div>
  );
};

export const AINote = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const noteId = searchParams.get('noteId');
  const [note, setNote] = useState<Note | null>(null);
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const searchStore = useSearchStore();

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await getClient().getNoteDetail({
        query: { noteId },
      });
      console.log('setNote', data?.data);
      if (data?.data) {
        setNote(data?.data);
      }
    };
    fetchData();
  }, [noteId]);

  useEffect(() => {
    const updateNote = async (note: Note) => {
      const { error } = await getClient().updateNote({
        body: { noteId: note.noteId, readOnly: note.readOnly },
      });
      if (error) {
        console.error(error);
      }
    };
    if (note) {
      updateNote(note);
    }
  }, [note]);

  if (!note) {
    return <p>Loading...</p>;
  }

  return (
    <div className="ai-note-container">
      <div className="knowledge-base-detail-header">
        <div className="knowledge-base-detail-navigation-bar">
          <div className="conv-meta">
            <IconEdit style={{ color: 'rgba(0, 0, 0, .6)' }} />
            <p className="conv-title">{note?.title || '新笔记'}</p>
          </div>
        </div>
        <div className="knowledge-base-detail-menu knowledge-base-detail-navigation-bar">
          {noteId && knowledgeBaseStore.noteServerStatus === 'connected' ? (
            <div className="conv-meta">
              <AiOutlineFileWord />
              <p className="conv-title">共 {knowledgeBaseStore.noteCharsCount} 字</p>
            </div>
          ) : null}
          {noteId && knowledgeBaseStore.noteServerStatus === 'disconnected' ? (
            <div className="conv-meta">
              <Divider type="vertical" />
              <AiOutlineWarning />
              <p className="conv-title">服务已断开</p>
            </div>
          ) : null}
          {noteId && knowledgeBaseStore.noteServerStatus === 'connected' ? (
            <div className="conv-meta">
              <Divider type="vertical" />
              <IconClockCircle />
              <p className="conv-title">
                {knowledgeBaseStore.noteSaveStatus === 'Saved' ? `笔记已自动保存` : `笔记保存中...`}
              </p>
            </div>
          ) : null}
          {noteId ? (
            <div className="conv-meta">
              <Divider type="vertical" />
              {note.readOnly ? <IconLock /> : <IconUnlock />}
              <p className="conv-title mr-2">{note.readOnly ? '只读' : '编辑'}</p>
              <Switch
                type="round"
                size="small"
                checked={note.readOnly}
                onChange={(readOnly) => setNote({ ...note, readOnly })}
              />
            </div>
          ) : null}
          <div className="conv-meta">
            <Divider type="vertical" />
            <Button
              icon={<IconSearch style={{ fontSize: 16 }} />}
              type="text"
              onClick={() => {
                searchStore.setPages(searchStore.pages.concat('note'));
                searchStore.setIsSearchOpen(true);
              }}
              className={'assist-action-item'}
            ></Button>
          </div>
          <div className="conv-meta">
            <NoteDropdownMenu note={note} />
          </div>
        </div>
      </div>
      {noteId ? (
        <div className="ai-note-editor">
          <AINoteHeader note={note} />
          <CollaborativeEditor note={note} />
        </div>
      ) : null}
    </div>
  );
};
