import { memo, useEffect, useMemo, useRef } from 'react';
import wordsCount from 'words-count';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { Canvas } from '@refly/openapi-schema';

import './index.scss';
import { useCookie } from 'react-use';
import { Divider, Input, Popover, Spin, Switch } from '@arco-design/web-react';
import { HiOutlineLockClosed, HiOutlineLockOpen, HiOutlineClock } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import { editorEmitter } from '@refly-packages/ai-workspace-common/utils/event-emitter/editor';

import {
  CollabEditorCommand,
  CollabGenAIMenuSwitch,
  CollabGenAIBlockMenu,
} from '@refly-packages/editor-component/advanced-editor';
import { EditorRoot } from '@refly-packages/editor-core/components';
import { EditorContent, EditorInstance } from '@refly-packages/editor-core/components';
import { DeleteDropdownMenu } from '@refly-packages/ai-workspace-common/components/project-detail/delete-dropdown-menu';
import { configureHighlightJs, ImageResizer, handleCommandNavigation } from '@refly-packages/editor-core/extensions';
import { defaultExtensions } from '@refly-packages/editor-component/extensions';
import { createUploadFn } from '@refly-packages/editor-component/image-upload';
import { configureSlashCommand } from '@refly-packages/editor-component/slash-command';
import { HocuspocusProvider } from '@hocuspocus/provider';
import Collaboration from '@tiptap/extension-collaboration';
import { useDebouncedCallback } from 'use-debounce';
import { handleImageDrop, handleImagePaste } from '@refly-packages/editor-core/plugins';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { getHierarchicalIndexes, TableOfContents } from '@tiptap-pro/extension-table-of-contents';

import { AiOutlineWarning, AiOutlineFileWord, AiOutlineDisconnect } from 'react-icons/ai';
import { getClientOrigin, getWsServerOrigin } from '@refly-packages/utils/url';
import { useCanvasStore, useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { useCanvasTabs } from '@refly-packages/ai-workspace-common/hooks/use-canvas-tabs';

// content selector
import { useContentSelector } from '@refly-packages/ai-workspace-common/modules/content-selector/hooks/use-content-selector';
import '@refly-packages/ai-workspace-common/modules/content-selector/styles/content-selector.scss';
import classNames from 'classnames';
import { useContentSelectorStore } from '@refly-packages/ai-workspace-common/modules/content-selector/stores/content-selector';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
// componets
import { ToC } from './ToC';
import { IconBook } from '@arco-design/web-react/icon';
import { useProjectTabs } from '@refly-packages/ai-workspace-common/hooks/use-project-tabs';
import { Button } from 'antd';
import { scrollToBottom } from '@refly-packages/ai-workspace-common/utils/ui';
import { zhMissingContent } from '@refly-packages/ai-workspace-common/components/project-detail/canvas/fixtures/zh-missing';
import { zhLsfContent } from '@refly-packages/ai-workspace-common/components/project-detail/canvas/fixtures/zh-lsf';
import { enInvestMemoContent } from '@refly-packages/ai-workspace-common/components/project-detail/canvas/fixtures/en-invest-memo';

const processStreamContent = (editor: EditorInstance, content: string) => {
  // Handle code blocks (```code```)
  if (content.startsWith('```')) {
    const language = content.split('\n')[0].slice(3) || 'plain';
    const code = content.split('\n').slice(1, -1).join('\n');
    editor.chain().setNode('codeBlock', { language }).insertContent(code).run();
    return;
  }

  // Handle blockquotes (> text)
  if (content.startsWith('>')) {
    editor.chain().setBlockquote().insertContent(content.substring(1).trim()).run();
    return;
  }

  // Handle horizontal rule (---, ___, ***)
  if (/^(-{3,}|_{3,}|\*{3,})$/.test(content)) {
    editor.chain().setHorizontalRule().run();
    return;
  }

  // Handle text marks
  const markPatterns = [
    // Bold: **text** or __text__
    { regex: /\*\*(.*?)\*\*|__(.*?)__/g, mark: 'bold', transform: (match) => match.slice(2, -2) },
    // Italic: *text* or _text_
    { regex: /\*(.*?)\*|_(.*?)_/g, mark: 'italic', transform: (match) => match.slice(1, -1) },
    // Strike: ~~text~~
    { regex: /~~(.*?)~~/g, mark: 'strike', transform: (match) => match.slice(2, -2) },
    // Inline code: `text`
    { regex: /`([^`]+)`/g, mark: 'code', transform: (match) => match.slice(1, -1) },
    // Link: [text](url)
    {
      regex: /\[([^\]]+)\]\(([^)]+)\)/g,
      mark: 'link',
      transform: (match, text, url) => ({ text, href: url }),
    },
  ];

  let processedContent = content;
  let hasMarks = false;

  for (const pattern of markPatterns) {
    if (pattern.regex.test(content)) {
      hasMarks = true;
      processedContent = processedContent.replace(pattern.regex, (match, ...args) => {
        const transformed = pattern.transform(match, ...args);
        if (pattern.mark === 'link') {
          editor
            .chain()
            .insertContent({
              type: 'text',
              text: transformed.text,
              marks: [{ type: 'link', attrs: { href: transformed.href } }],
            })
            .run();
          return '';
        } else {
          editor.chain().setMark(pattern.mark).insertContent(transformed).unsetMark(pattern.mark).run();
          return '';
        }
      });
    }
  }

  if (!hasMarks) {
    // Handle existing patterns
    if (content.startsWith('#')) {
      // Heading
      const level = content.split(' ')[0].length;
      editor
        .chain()
        .setNode('heading', { level })
        .insertContent(content.substring(level + 1))
        .run();
    } else if (content.startsWith('-') || content.startsWith('*')) {
      // List item
      editor.chain().toggleBulletList().insertContent(content.substring(1).trim()).run();
    } else if (content.startsWith('1.')) {
      // Ordered list item
      editor.chain().toggleOrderedList().insertContent(content.substring(2).trim()).run();
    } else if (content.includes('\n')) {
      // Multiple lines
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line) {
          editor.commands.insertContent(line);
        }
        if (index < lines.length - 1) {
          editor.commands.enter();
        }
      });
    } else {
      // Single word or inline content
      editor.commands.insertContent(content);
    }
  }
};

class TokenStreamProcessor {
  private editor: EditorInstance;
  private chunk: string;
  private isLineStart: boolean;
  private isInList: boolean;

  markPatterns = [
    { pattern: '**', mark: 'bold' },
    { pattern: '__', mark: 'bold' },
    { pattern: '*', mark: 'italic' },
    { pattern: '_', mark: 'italic' },
    { pattern: '~~', mark: 'strike' },
    { pattern: '`', mark: 'code' },
  ];

  constructor() {
    this.chunk = '';
    this.isLineStart = true;
    this.isInList = false;
  }

  setEditor(editor: EditorInstance) {
    this.editor = editor;
  }

  processMark(pattern: string, mark: string) {
    console.log('processMark', JSON.stringify({ pattern, mark }));
    const lines = this.chunk.split(pattern);
    lines.forEach((line, index) => {
      if (line) {
        console.log('insertContent', JSON.stringify({ line }));
        this.editor.commands.insertContent(line);
      }
      if (index < lines.length - 1) {
        console.log('toggleMark', mark);
        this.editor.commands.toggleMark(mark);
      }
    });
    this.chunk = '';
  }

  process(token: string) {
    if (!this.editor) {
      return;
    }

    this.chunk += token;
    console.log(
      'process',
      JSON.stringify({
        content: token,
        chunk: this.chunk,
        isLineStart: this.isLineStart,
        isInList: this.isInList,
      }),
    );

    // Wait for the next token if the current chunk is a single space or part of
    // markdown syntax element (list, heading, marks, etc.)
    if (this.chunk.match(/^[-*_#`>~ ]$/)) {
      return;
    }

    if (this.isLineStart) {
      // If the chunk is a number string with an optional dot, it could be a ordered list item
      if (/^\d+\.?$/.test(this.chunk)) {
        return;
      }

      const isBulletList = /^[-*]\s/.test(this.chunk);
      const isOrderedList = /^\d+\.\s/.test(this.chunk);

      if (isBulletList || isOrderedList) {
        this.isLineStart = false;
        this.chunk = this.chunk.replace(/^[-*\d]+\.?\s/, '');

        if (!this.isInList) {
          this.isInList = true;
          console.log('set isInList to true');

          // insert a list item with a random character and then delete it to toggle list
          // this is a workaround to make the entire editing process revertible within a single undo step
          if (isBulletList) {
            this.editor.commands.insertContent('- a');
          } else {
            this.editor.commands.insertContent('1. a');
          }
          this.editor.commands.deleteRange({
            from: this.editor.state.selection.from - 1,
            to: this.editor.state.selection.from,
          });
        }
      } else {
        if (this.isInList) {
          console.log('set isInList to false, enter to exit list');
          this.isInList = false;
          this.editor.commands.enter();
        }
      }
    }

    // Check if the chunk contains any mark pattern
    for (const pattern of this.markPatterns) {
      if (this.chunk.includes(pattern.pattern)) {
        this.processMark(pattern.pattern, pattern.mark);
        return;
      }
    }

    // Handle line breaks
    if (this.chunk.includes('\n')) {
      const lines = this.chunk.replace(/\n+/g, '\n').split('\n');
      lines.forEach((line, index) => {
        if (line) {
          console.log('insertContent', JSON.stringify({ line }));
          this.editor.commands.insertContent(line);
        }
        if (index < lines.length - 1) {
          console.log('enter new line');
          this.editor.commands.enter();
          this.isLineStart = true;
        }
      });
      this.chunk = '';
      return;
    }

    // Check if the chunk has a common string prefix with '</reflyCanvas>'
    if ('</reflyCanvas>'.startsWith(this.chunk)) {
      console.log('chunk could be prefix of </reflyCanvas>', this.chunk);
      return;
    }

    console.log('insertChunk', JSON.stringify({ chunk: this.chunk }));
    this.editor.commands.insertContent(this.chunk);
    this.chunk = '';
    this.isLineStart = false;
  }
}

const MemorizedToC = memo(ToC);

const CollaborativeEditor = ({ projectId, canvasId }: { projectId: string; canvasId: string }) => {
  const { t } = useTranslation();
  const lastCursorPosRef = useRef<number>();
  const [token] = useCookie('_refly_ai_sid');

  const canvasStore = useCanvasStore((state) => ({
    currentCanvas: state.currentCanvas,
    canvasServerStatus: state.canvasServerStatus,
    updateCurrentCanvas: state.updateCurrentCanvas,
    updateCanvasCharsCount: state.updateCanvasCharsCount,
    updateCanvasSaveStatus: state.updateCanvasSaveStatus,
    updateCanvasServerStatus: state.updateCanvasServerStatus,
    updateEditor: state.updateEditor,
    updateTocItems: state.updateTocItems,
    updateLastCursorPosRef: state.updateLastCursorPosRef,
  }));

  const contextPanelStore = useContextPanelStore((state) => ({
    updateBeforeSelectionNoteContent: state.updateBeforeSelectionNoteContent,
    updateAfterSelectionNoteContent: state.updateAfterSelectionNoteContent,
    updateCurrentSelectionContent: state.updateCurrentSelectionContent,
  }));
  const editorRef = useRef<EditorInstance>();

  const { showContentSelector, scope } = useContentSelectorStore((state) => ({
    showContentSelector: state.showContentSelector,
    scope: state.scope,
  }));

  // initial block selection
  const baseUrl = getClientOrigin();
  const { initContentSelectorElem, addInlineMarkForNote } = useContentSelector(
    'ai-note-editor-content-container',
    'canvasSelection',
    {
      url: `${baseUrl}/project/${projectId}?canvasId=${canvasId}`,
    },
  );

  const websocketProvider = useMemo(() => {
    const provider = new HocuspocusProvider({
      url: getWsServerOrigin(),
      name: canvasId,
      token,
    });
    provider.on('status', (event) => {
      canvasStore.updateCanvasServerStatus(event.status);
    });
    return provider;
  }, [canvasId]);

  const uploadFn = useMemo(() => createUploadFn({ entityId: canvasId, entityType: 'canvas' }), [canvasId]);
  const slashCommand = useMemo(
    () =>
      configureSlashCommand({
        entityId: canvasId,
        entityType: 'canvas',
      }),
    [canvasId],
  );

  const extensions = [
    ...defaultExtensions,
    slashCommand,
    Collaboration.configure({
      document: websocketProvider.document,
    }),
    CollaborationCursor.configure({
      provider: websocketProvider,
    }),
    TableOfContents.configure({
      getIndex: getHierarchicalIndexes,
      onUpdate(content) {
        canvasStore.updateTocItems(content);
      },
    }),
  ];

  // Apply Codeblock Highlighting on the HTML from editor.getHTML()
  const highlightCodeblocks = async (content: string) => {
    const hljs = await configureHighlightJs();
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
    const markdown = editor.storage.markdown.getMarkdown();
    canvasStore.updateCanvasCharsCount(wordsCount(markdown));
    window.localStorage.setItem('html-content', await highlightCodeblocks(editor.getHTML()));
    window.localStorage.setItem('novel-content', JSON.stringify(json));
    window.localStorage.setItem('markdown', editor.storage.markdown.getMarkdown());
    canvasStore.updateCanvasSaveStatus('Saved');
  }, 500);

  const handleContentSelectorClick = () => {
    addInlineMarkForNote();
  };

  useEffect(() => {
    return () => {
      websocketProvider.forceSync();
      websocketProvider.destroy();
      editorRef.current?.destroy();
    };
  }, [canvasId]);

  const readOnly = canvasStore?.currentCanvas?.readOnly ?? false;

  useEffect(() => {
    if (editorRef.current && !readOnly) {
      editorRef.current.on('blur', () => {
        lastCursorPosRef.current = editorRef.current?.view?.state?.selection?.$head?.pos;

        const editor = editorRef.current;
        const { state } = editor?.view || {};
        const { selection } = state || {};
        const { doc } = editor?.state || {};
        const { from, to } = selection || {};

        const getMarkdownSlice = (start: number, end: number) => {
          const slice = doc.slice(start, end);
          return editor.storage.markdown.serializer.serialize(slice.content);
        };

        const prevSelectionContent = getMarkdownSlice(0, from);
        const afterSelectionContent = getMarkdownSlice(to, editor?.state?.doc?.content?.size);
        const selectedContent = getMarkdownSlice(from, to);

        canvasStore.updateLastCursorPosRef(lastCursorPosRef.current);
        contextPanelStore.updateCurrentSelectionContent(selectedContent);
        contextPanelStore.updateBeforeSelectionNoteContent(prevSelectionContent);
        contextPanelStore.updateAfterSelectionNoteContent(afterSelectionContent);
      });
    }
  }, [editorRef.current, readOnly]);

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

  const processor = new TokenStreamProcessor();

  useEffect(() => {
    const handleStreamContent = (content: string) => {
      if (editorRef.current) {
        processor.setEditor(editorRef.current);
        try {
          console.log('streamCanvasContent', JSON.stringify({ content }));
          processor.process(content);
          // setTimeout(() => {
          //   scrollToBottom();
          // });
        } catch (error) {
          console.error('streamCanvasContent error', error);
        }
      }
    };

    // Listen for stream content events
    editorEmitter.on('streamCanvasContent', handleStreamContent);

    return () => {
      editorEmitter.off('streamCanvasContent', handleStreamContent);
    };
  }, []);

  const insertShortTestContent = () => {
    const editor = editorRef.current;
    editor.commands.insertContent('normal');
    editor.commands.insertContent(':\n');
    editor.commands.insertContent('1. a');
    editor.commands.deleteRange({
      from: editor.state.selection.from - 1,
      to: editor.state.selection.from,
    });
    editor.commands.insertContent('hello');
    editor.commands.enter();
    editor.commands.insertContent('world');
    return;
  };

  const insertLongTestContent = async () => {
    if (editorRef.current) {
      processor.setEditor(editorRef.current);

      const content = [
        { content: 'are' },
        { content: ':\n' },
        { content: '1' },
        { content: '.' },
        { content: ' ' },
        { content: 'hello' },
        // { content: ' **' },
        // { content: 'Market' },
        // { content: '**' },
      ];

      for (const item of enInvestMemoContent) {
        try {
          processor.process(item.content);
          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (error) {
          console.error('insertLongTestContent error', error);
        }
      }
    }
  };

  useEffect(() => {
    if (editorRef.current) {
      if (readOnly) {
        // ensure we sync the content just before setting the editor to readonly
        websocketProvider.forceSync();
      }
      editorRef.current.setOptions({ editable: !readOnly });
    }
  }, [readOnly]);

  return (
    <div
      className={classNames('w-full', 'ai-note-editor-content-container', {
        'refly-selector-mode-active': showContentSelector,
        'refly-block-selector-mode': scope === 'block',
        'refly-inline-selector-mode': scope === 'inline',
      })}
    >
      {initContentSelectorElem()}
      <div className="w-full h-full">
        <Button onClick={insertShortTestContent}>short test</Button>
        <Button onClick={insertLongTestContent}>long test</Button>
        <EditorRoot>
          <EditorContent
            extensions={extensions}
            onCreate={({ editor }) => {
              editorRef.current = editor;
              canvasStore.updateEditor(editor);
            }}
            editable={!readOnly}
            className="w-full h-full border-muted sm:rounded-lg"
            editorProps={{
              handleDOMEvents: {
                keydown: (_view, event) => handleCommandNavigation(event),
              },
              handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
              handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
              attributes: {
                class: 'prose prose-md prose-headings:font-title font-default focus:outline-none max-w-full',
              },
            }}
            onUpdate={({ editor }) => {
              debouncedUpdates(editor);
              canvasStore.updateCanvasSaveStatus('Unsaved');
            }}
            slotAfter={<ImageResizer />}
          >
            <CollabEditorCommand entityId={canvasId} entityType="note" />
            <CollabGenAIMenuSwitch
              contentSelector={{
                text: t('knowledgeBase.context.addToContext'),
                handleClick: handleContentSelectorClick,
              }}
            />
            <CollabGenAIBlockMenu />
          </EditorContent>
        </EditorRoot>
      </div>
    </div>
  );
};

export const CanvasStatusBar = () => {
  const { currentCanvas, updateCurrentCanvas, canvasServerStatus, noteCharsCount, noteSaveStatus, editor, tocItems } =
    useCanvasStore((state) => ({
      currentCanvas: state.currentCanvas,
      updateCurrentCanvas: state.updateCurrentCanvas,
      canvasServerStatus: state.canvasServerStatus,
      noteCharsCount: state.canvasCharsCount,
      noteSaveStatus: state.canvasSaveStatus,
      editor: state.editor,
      tocItems: state.tocItems,
    }));
  const { handleDeleteTab } = useCanvasTabs();
  const { t } = useTranslation();

  return (
    <div className="note-status-bar">
      <div className="note-status-bar-menu">
        {canvasServerStatus === 'connected' ? (
          <div className="note-status-bar-item">
            <AiOutlineFileWord />
            <p className="conv-title">{t('knowledgeBase.note.noteCharsCount', { count: noteCharsCount })}</p>
          </div>
        ) : null}
        {canvasServerStatus === 'disconnected' ? (
          <div className="note-status-bar-item">
            <AiOutlineWarning />
            <p className="conv-title">{t('knowledgeBase.note.serviceDisconnected')}</p>
          </div>
        ) : null}
        {canvasServerStatus === 'connected' ? (
          <div className="note-status-bar-item">
            <Divider type="vertical" />
            <HiOutlineClock />
            <p className="conv-title">
              {noteSaveStatus === 'Saved' ? t('knowledgeBase.note.autoSaved') : t('knowledgeBase.note.saving')}
            </p>
          </div>
        ) : null}
      </div>
      <div className="note-status-bar-menu">
        <div className="note-status-bar-item" style={{ display: 'flex', alignItems: 'center', marginRight: 10 }}>
          <Popover
            content={
              <div className="sidebar">
                <div className="sidebar-options">
                  <div className="label-large">Table of contents</div>
                  <div className="table-of-contents">
                    <MemorizedToC editor={editor} items={tocItems} />
                  </div>
                </div>
              </div>
            }
          >
            <IconBook style={{ fontSize: 16 }} />
          </Popover>
          <Divider type="vertical" />
        </div>
        {currentCanvas && canvasServerStatus === 'connected' ? (
          <div className="note-status-bar-item">
            {currentCanvas?.readOnly ? <HiOutlineLockClosed /> : <HiOutlineLockOpen />}
            <p className="mr-2 conv-title">
              {currentCanvas?.readOnly ? t('knowledgeBase.note.readOnly') : t('knowledgeBase.note.edit')}
            </p>
            <Switch
              type="round"
              size="small"
              checked={currentCanvas?.readOnly}
              onChange={(readOnly) => updateCurrentCanvas({ ...currentCanvas, readOnly })}
            />
          </div>
        ) : null}
        <div className="note-status-bar-item">
          <Divider type="vertical" />
          <DeleteDropdownMenu
            type="canvas"
            canCopy={true}
            data={currentCanvas}
            postDeleteList={(canvas: Canvas) => handleDeleteTab(canvas.canvasId)}
          />
        </div>
      </div>
    </div>
  );
};

export const CanvasEditorHeader = (props: { projectId: string; canvasId: string }) => {
  const { projectId, canvasId } = props;
  const { currentCanvas, updateCurrentCanvas } = useCanvasStoreShallow((state) => ({
    currentCanvas: state.currentCanvas,
    updateCurrentCanvas: state.updateCurrentCanvas,
  }));
  const { tabsMap, handleUpdateTab } = useProjectTabs();
  const tab = tabsMap[projectId]?.find((tab) => tab.key === canvasId);

  const onTitleChange = (newTitle: string) => {
    updateCurrentCanvas({ ...currentCanvas, title: newTitle });

    if (tab) {
      handleUpdateTab(projectId, canvasId, {
        ...tab,
        title: newTitle,
      });
    }
  };

  useEffect(() => {
    editorEmitter.on('updateCanvasTitle', onTitleChange);

    return () => {
      editorEmitter.off('updateCanvasTitle', onTitleChange);
    };
  }, []);

  const title = tab?.title || currentCanvas?.title;

  return (
    <div className="w-full">
      <div className="mx-2 mt-4 max-w-screen-lg">
        <Input
          className="text-3xl font-bold bg-transparent focus:border-transparent focus:bg-transparent"
          placeholder="Enter The Title"
          value={title}
          onChange={onTitleChange}
        />
      </div>
    </div>
  );
};

export const CanvasEditor = (props: { projectId: string; canvasId: string }) => {
  const { projectId, canvasId } = props;

  const { t } = useTranslation();

  const {
    currentCanvas: canvas,
    isRequesting,
    newNoteCreating,
    canvasServerStatus,
    updateCurrentCanvas,
    updateIsRequesting,
    updateCanvasServerStatus,
    resetState,
  } = useCanvasStore((state) => ({
    currentCanvas: state.currentCanvas,
    isRequesting: state.isRequesting,
    newNoteCreating: state.newCanvasCreating,
    canvasServerStatus: state.canvasServerStatus,
    updateCurrentCanvas: state.updateCurrentCanvas,
    updateIsRequesting: state.updateIsRequesting,
    updateCanvasServerStatus: state.updateCanvasServerStatus,
    resetState: state.resetState,
  }));
  const prevNote = useRef<Canvas>();

  useEffect(() => {
    return () => {
      resetState();
    };
  }, []);

  useEffect(() => {
    updateCurrentCanvas(null);

    const fetchData = async () => {
      updateIsRequesting(true);
      const { data } = await getClient().getCanvasDetail({
        query: { canvasId },
      });
      const canvas = data?.data;
      if (canvas) {
        updateCurrentCanvas(canvas);
        updateIsRequesting(false);
      }
    };
    if (canvasId) {
      fetchData();
    }

    return () => {
      updateIsRequesting(false);
    };
  }, [canvasId]);

  const debouncedUpdateNote = useDebouncedCallback(async (canvas: Canvas) => {
    const res = await getClient().updateCanvas({
      body: {
        canvasId: canvas.canvasId,
        title: canvas.title,
        readOnly: canvas.readOnly,
      },
    });
    if (res.error) {
      console.error(res.error);
      return;
    }
  }, 500);

  useEffect(() => {
    if (canvas && prevNote.current?.canvasId === canvas.canvasId) {
      debouncedUpdateNote(canvas);
    }
    prevNote.current = canvas;
  }, [canvas, debouncedUpdateNote]);

  return (
    <div className="ai-note-container">
      <Spin
        tip={t('knowledgeBase.note.connecting')}
        loading={!canvas || isRequesting || canvasServerStatus !== 'connected'}
        style={{ height: '100%', width: '100%' }}
      >
        <div className="ai-note-editor">
          <div className="ai-note-editor-container">
            <CanvasEditorHeader projectId={projectId} canvasId={canvasId} />
            <CollaborativeEditor projectId={projectId} canvasId={canvasId} />
          </div>
        </div>
      </Spin>
      <CanvasStatusBar />
    </div>
  );
};
