import { memo, useEffect, useMemo, useRef, useState } from 'react';
import wordsCount from 'words-count';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { CanvasNodeType, Document } from '@refly/openapi-schema';

import './index.scss';
import { useCookie } from 'react-use';
import { Input, Popover, Spin } from '@arco-design/web-react';
import { HiOutlineLockClosed, HiOutlineLockOpen, HiOutlineClock, HiOutlineShare } from 'react-icons/hi2';
import { IconQuote } from '@refly-packages/ai-workspace-common/components/common/icon';
import { useTranslation } from 'react-i18next';
import { editorEmitter } from '@refly-packages/utils/event-emitter/editor';

import {
  CollabEditorCommand,
  CollabGenAIMenuSwitch,
  CollabGenAIBlockMenu,
} from '@refly-packages/ai-workspace-common/components/editor/components/advanced-editor';
import {
  EditorRoot,
  EditorContent,
  EditorInstance,
} from '@refly-packages/ai-workspace-common/components/editor/core/components';

import {
  configureHighlightJs,
  ImageResizer,
  handleCommandNavigation,
} from '@refly-packages/ai-workspace-common/components/editor/core/extensions';
import {
  defaultExtensions,
  Placeholder,
} from '@refly-packages/ai-workspace-common/components/editor/components/extensions';
import { createUploadFn } from '@refly-packages/ai-workspace-common/components/editor/components/image-upload';
import { configureSlashCommand } from '@refly-packages/ai-workspace-common/components/editor/components/slash-command';
import { HocuspocusProvider } from '@hocuspocus/provider';
import Collaboration from '@tiptap/extension-collaboration';
import { useDebouncedCallback } from 'use-debounce';
import { handleImageDrop, handleImagePaste } from '@refly-packages/ai-workspace-common/components/editor/core/plugins';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { getHierarchicalIndexes, TableOfContents } from '@tiptap-pro/extension-table-of-contents';

import { DeleteDropdownMenu } from './dropdown';
import { AiOutlineWarning, AiOutlineFileWord } from 'react-icons/ai';
import { getClientOrigin, getWsServerOrigin } from '@refly-packages/utils/url';
import { useDocumentStore, useDocumentStoreShallow } from '@refly-packages/ai-workspace-common/stores/document';
import { useCanvasTabs } from '@refly-packages/ai-workspace-common/hooks/use-canvas-tabs';

// content selector
import '@refly-packages/ai-workspace-common/modules/content-selector/styles/content-selector.scss';
import classNames from 'classnames';
import { useContentSelectorStore } from '@refly-packages/ai-workspace-common/modules/content-selector/stores/content-selector';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
// componets
import { ToC } from './ToC';
import { IconBook } from '@arco-design/web-react/icon';
import { Button, Divider, message, Modal } from 'antd';
import { useHandleShare } from '@refly-packages/ai-workspace-common/hooks/use-handle-share';
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useReferencesStoreShallow } from '@refly-packages/ai-workspace-common/stores/references';
import { useBlocker } from 'react-router-dom';
import { genUniqueId } from '@refly-packages/utils/id';
import { useSelectionContext } from '@refly-packages/ai-workspace-common/hooks/use-selection-context';

class TokenStreamProcessor {
  private editor: EditorInstance;
  private chunk: string;
  private isLineStart: boolean;
  private isCodeBlockStart: boolean;
  private isInList: boolean;
  private currentListDepth: number = 0;

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
    this.isCodeBlockStart = false;
    this.isInList = false;
  }

  setEditor(editor: EditorInstance) {
    this.editor = editor;
  }

  isCodeBlockActive() {
    return this.editor.isActive('codeBlock');
  }

  enterNewLine() {
    // Handle code block
    if (this.isCodeBlockActive()) {
      // Only enter newlines if not at the start of code block
      if (!this.isCodeBlockStart) {
        this.editor.commands.enter();
        this.isLineStart = true;
      }
      return;
    }

    // Don't allow new lines at line start
    // since we don't want empty paragraphs
    if (this.isLineStart) {
      return;
    }

    this.editor.commands.enter();
    this.isLineStart = true;
  }

  insertContent(content: string) {
    // Handle line breaks
    if (content.includes('\n')) {
      // If not in a code block, replace all new lines with a single new line
      // to avoid creating empty paragraphs
      if (!this.isCodeBlockActive()) {
        content = content.replace(/\n+/g, '\n');
      }

      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line) {
          this.insertContent(line);
        }
        if (index < lines.length - 1) {
          this.enterNewLine();
        }
      });
      this.chunk = '';
      return;
    }

    if (this.isLineStart && !this.isCodeBlockActive()) {
      // Directly call insertContent to trigger block activation
      // such as headings, blockquotes, etc.
      this.editor.commands.insertContent(content);
    } else {
      // If not at line start or within a code block, insert text as a regular text node
      this.editor.commands.insertContent({ type: 'text', text: content });
    }

    this.chunk = '';
    this.isLineStart = false;
    this.isCodeBlockStart = false;

    // Focus with scroll options
    const currentPos = this.editor.state.selection.from;
    this.editor.commands.focus(currentPos, { scrollIntoView: true });
  }

  processMark(pattern: string, mark: string) {
    const lines = this.chunk.split(pattern);
    lines.forEach((line, index) => {
      if (line) {
        this.insertContent(line);
      }
      if (index < lines.length - 1) {
        this.editor.commands.toggleMark(mark);
      }
    });
    this.chunk = '';
  }

  processCodeFence() {
    if (this.isCodeBlockActive()) {
      this.editor.commands.deleteRange({
        from: this.editor.state.selection.from - 1,
        to: this.editor.state.selection.from,
      });
      this.editor.commands.insertContent('```');
      this.editor.commands.toggleCodeBlock();
    } else {
      this.editor.commands.insertContent(this.chunk);
      this.isCodeBlockStart = true;
    }

    this.chunk = '';
  }

  activateList(listType: 'bulletList' | 'orderedList') {
    const listDepth = Math.round(this.chunk.match(/^\s*/)[0].length / 3);

    // Adjust current list depth to match the list depth of the chunk
    if (listDepth > this.currentListDepth) {
      for (let i = 0; i < listDepth - this.currentListDepth; i++) {
        this.editor.commands.sinkListItem('listItem');
      }
    } else if (listDepth < this.currentListDepth) {
      for (let i = 0; i < this.currentListDepth - listDepth; i++) {
        this.editor.commands.liftListItem('listItem');
      }
    }

    this.currentListDepth = listDepth;
    this.isLineStart = false;
    this.chunk = this.chunk.replace(/^\s*[-*\d]+\.?\s/, '');

    // Start a new list if not in a list
    if (!this.isInList) {
      this.isInList = true;

      // insert a list item with a random character and then delete it to toggle list
      // this is a workaround to make the entire editing process revertible within a single undo step
      if (listType === 'bulletList') {
        this.editor.commands.insertContent('- a');
      } else {
        this.editor.commands.insertContent('1. a');
      }
      this.editor.commands.deleteRange({
        from: this.editor.state.selection.from - 1,
        to: this.editor.state.selection.from,
      });
      return;
    }

    // Already in a list, make sure the list type matches
    if (!this.editor.isActive(listType)) {
      if (listType === 'bulletList') {
        this.editor.commands.toggleBulletList();
      } else {
        this.editor.commands.toggleOrderedList();
      }
    }
  }

  deactivateList() {
    if (!this.isInList) {
      return;
    }

    // Reset list depth to 0
    for (let i = 0; i < this.currentListDepth; i++) {
      this.editor.commands.liftListItem('listItem');
    }
    this.currentListDepth = 0;

    this.isInList = false;
    this.editor.commands.enter();
  }

  process(token: string) {
    if (!this.editor) {
      return;
    }

    this.chunk += token;

    // Skip processing if the chunk is part of the closing canvas tag (including HTML entities)
    if (
      this.chunk === '<' ||
      '</reflyCanvas>'.startsWith(this.chunk) ||
      this.chunk === '&' ||
      '&lt;/reflyCanvas'.startsWith(this.chunk) ||
      '&lt;/reflyCanvas&gt;'.startsWith(this.chunk)
    ) {
      return;
    }

    // If the chunk contains the closing tag (including HTML entities), only process content before it
    if (
      this.chunk.includes('</reflyCanvas>') ||
      this.chunk.includes('&lt;/reflyCanvas') ||
      this.chunk.includes('&lt;/reflyCanvas&gt;')
    ) {
      const content = this.chunk
        .split('</reflyCanvas>')[0]
        .split('&lt;/reflyCanvas')[0]
        .split('&lt;/reflyCanvas&gt;')[0];

      if (content) {
        this.chunk = content;
      } else {
        return;
      }
    }

    // Wait for the next token if the current chunk only contains whitespace or
    // markdown syntax element (list, heading, marks, etc.)
    if (this.chunk.match(/^[-*_#`>~ ]+$/)) {
      return;
    }

    if (this.isLineStart) {
      // If the chunk is a number string with an optional dot, it could be a ordered list item
      if (/^\d+\.?$/.test(this.chunk)) {
        return;
      }

      const isBulletList = /^\s*[-*]\s/.test(this.chunk);
      const isOrderedList = /^\s*\d+\.\s/.test(this.chunk);
      const isCodeFence = /^\s*```/.test(this.chunk);

      if (isBulletList || isOrderedList) {
        this.activateList(isBulletList ? 'bulletList' : 'orderedList');
      } else {
        if (this.isInList) {
          this.deactivateList();
        }
      }

      if (isCodeFence) {
        this.processCodeFence();
        return;
      }
    }

    // Check if the chunk contains any mark pattern outside of code block
    if (!this.isCodeBlockActive()) {
      for (const pattern of this.markPatterns) {
        if (this.chunk.includes(pattern.pattern)) {
          this.processMark(pattern.pattern, pattern.mark);
          return;
        }
      }
    }

    this.insertContent(this.chunk);
  }

  reset() {
    this.chunk = '';
    this.isLineStart = true;
    this.isCodeBlockStart = false;
    this.isInList = false;
    this.currentListDepth = 0;
  }
}

const MemorizedToC = memo(ToC);

const CollaborativeEditor = ({ docId }: { docId: string }) => {
  const { t } = useTranslation();
  const lastCursorPosRef = useRef<number>();
  const [token] = useCookie('_refly_ai_sid');
  const processorRef = useRef<TokenStreamProcessor>();

  const documentStore = useDocumentStoreShallow((state) => ({
    isAiEditing: state.isAiEditing,
    currentDocument: state.currentDocument,
    documentServerStatus: state.documentServerStatus,
    updateIsAiEditing: state.updateIsAiEditing,
    updateCurrentDocument: state.updateCurrentDocument,
    updateDocumentCharsCount: state.updateDocumentCharsCount,
    updateDocumentSaveStatus: state.updateDocumentSaveStatus,
    updateDocumentServerStatus: state.updateDocumentServerStatus,
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

  const createPlaceholderExtension = () => {
    return Placeholder.configure({
      placeholder: ({ node }) => {
        const defaultPlaceholder = t('knowledgeBase.canvas.editor.placeholder.default', {
          defaultValue: "Write something, or press 'space' for AI, '/' for commands",
        });

        switch (node.type.name) {
          case 'heading':
            return t('editor.placeholder.heading', {
              level: node.attrs.level,
              defaultValue: `Heading ${node.attrs.level}`,
            });
          case 'paragraph':
            return defaultPlaceholder;
          case 'codeBlock':
          case 'orderedList':
          case 'bulletList':
          case 'listItem':
          case 'taskList':
          case 'taskItem':
            return '';
          default:
            return defaultPlaceholder;
        }
      },
      includeChildren: true,
    });
  };

  const { addToContext, selectedText } = useSelectionContext({
    containerClass: 'ai-note-editor-content-container',
  });

  const buildNodeData = (text: string) => {
    const { currentDocument } = useDocumentStore.getState();

    return {
      id: genUniqueId(),
      type: 'document' as CanvasNodeType,
      position: { x: 0, y: 0 },
      data: {
        entityId: currentDocument?.docId ?? '',
        title: currentDocument?.title ?? 'Selected Content',
        metadata: {
          contentPreview: text,
          selectedContent: text,
          xPath: genUniqueId(),
          sourceEntityId: currentDocument?.docId ?? '',
          sourceEntityType: 'document',
          sourceType: 'documentSelection',
        },
      },
    };
  };

  const handleAddToContext = (text: string) => {
    const node = buildNodeData(text);

    addToContext(node);
  };

  const websocketProvider = useMemo(() => {
    const provider = new HocuspocusProvider({
      url: getWsServerOrigin(),
      name: docId,
      token,
    });
    provider.on('status', (event) => {
      documentStore.updateDocumentServerStatus(event.status);
    });

    // Add synced event listener
    provider.on('synced', () => {
      editorEmitter.emit('editorSynced');
    });
    return provider;
  }, [docId]);

  const uploadFn = useMemo(() => createUploadFn({ entityId: docId, entityType: 'document' }), [docId]);

  const extensions = useMemo(
    () => [
      ...defaultExtensions,
      configureSlashCommand({
        entityId: docId,
        entityType: 'document',
      }),
      createPlaceholderExtension(),
      Collaboration.configure({
        document: websocketProvider.document,
      }),
      // CollaborationCursor.configure({
      //   provider: websocketProvider,
      // }),
      TableOfContents.configure({
        getIndex: getHierarchicalIndexes,
        onUpdate(content) {
          documentStore.updateTocItems(content);
        },
      }),
    ],
    [websocketProvider, docId],
  );

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
    documentStore.updateDocumentCharsCount(wordsCount(markdown));
    window.localStorage.setItem('html-content', await highlightCodeblocks(editor.getHTML()));
    window.localStorage.setItem('novel-content', JSON.stringify(json));
    window.localStorage.setItem('markdown', editor.storage.markdown.getMarkdown());
    documentStore.updateDocumentSaveStatus('Saved');
  }, 500);

  useEffect(() => {
    return () => {
      websocketProvider.forceSync();
      websocketProvider.destroy();
      editorRef.current?.destroy();
    };
  }, [docId]);

  const readOnly = documentStore?.currentDocument?.readOnly ?? false;

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

        documentStore.updateLastCursorPosRef(lastCursorPosRef.current);
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

  useEffect(() => {
    const handleStreamContent = (event: { isFirst: boolean; content: string }) => {
      const { isFirst, content } = event || {};
      if (editorRef.current) {
        if (isFirst || !processorRef.current) {
          processorRef.current = new TokenStreamProcessor();
        }

        processorRef.current.setEditor(editorRef.current);
        try {
          processorRef.current.process(content);
        } catch (error) {
          console.error('streamCanvasContent error', error);
        }
      }
    };

    const handleStreamEditCanvasContent = (event: { isFirst: boolean; content: string }) => {
      try {
        const { messageIntentContext } = useChatStore.getState();
        const canvasEditConfig = messageIntentContext?.canvasEditConfig;

        const { isFirst, content } = event;
        if (editorRef.current && canvasEditConfig?.selectedRange) {
          if (!processorRef.current || isFirst) {
            processorRef.current = new TokenStreamProcessor();
          }
          const { selectedRange } = canvasEditConfig;
          processorRef.current.setEditor(editorRef.current);

          if (isFirst) {
            // 1. Select and delete the content range
            editorRef.current.commands.setTextSelection({
              from: selectedRange.startIndex,
              to: selectedRange.endIndex,
            });
            editorRef.current.commands.deleteSelection();

            // 2. Move cursor to start position
            editorRef.current.commands.setTextSelection(selectedRange.startIndex);
          }

          // Process content using the same logic as regular streaming
          processorRef.current.process(content);
        }
      } catch (error) {
        console.error('handleStreamEditCanvasContent error', error);
      }
    };

    // Listen for stream content events
    editorEmitter.on('streamCanvasContent', handleStreamContent);
    editorEmitter.on('streamEditCanvasContent', handleStreamEditCanvasContent);

    return () => {
      editorEmitter.off('streamCanvasContent', handleStreamContent);
      editorEmitter.off('streamEditCanvasContent', handleStreamEditCanvasContent);
    };
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      if (readOnly) {
        // ensure we sync the content just before setting the editor to readonly
        websocketProvider.forceSync();
      }
      editorRef.current.setOptions({ editable: !readOnly });
    }
  }, [readOnly]);

  // Add navigation blocker
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      documentStore.isAiEditing &&
      (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search),
  );

  const [modal, contextHolder] = Modal.useModal();

  // Handle blocking navigation
  useEffect(() => {
    if (blocker.state === 'blocked') {
      modal.confirm({
        title: t('knowledgeBase.canvas.leavePageModal.title'),
        content: t('knowledgeBase.canvas.leavePageModal.content'),
        centered: true,
        okText: t('common.confirm'),
        cancelText: t('common.cancel'),
        onOk: () => {
          documentStore.updateIsAiEditing(false);
          blocker.proceed();
        },
        onCancel: () => {
          blocker.reset();
        },
      });
    }
  }, [blocker]);

  // Add window beforeunload handler
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (documentStore.isAiEditing) {
        // Standard-compliant browsers
        const message = 'AI is still editing. Changes you made may not be saved.';
        e.preventDefault();
        e.returnValue = message; // Chrome requires returnValue to be set
        return message; // Safari requires return value
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [documentStore.isAiEditing]);

  return (
    <div
      className={classNames('w-full', 'ai-note-editor-content-container', {
        'refly-selector-mode-active': showContentSelector,
        'refly-block-selector-mode': scope === 'block',
        'refly-inline-selector-mode': scope === 'inline',
      })}
    >
      <div className="w-full h-full">
        {documentStore.isAiEditing && (
          <div
            className="absolute inset-0 bg-transparent z-[1000] pointer-events-auto select-none"
            onMouseDown={(e) => e.preventDefault()}
            onMouseUp={(e) => e.preventDefault()}
            onClick={(e) => e.preventDefault()}
            onDoubleClick={(e) => e.preventDefault()}
          />
        )}
        <EditorRoot>
          <EditorContent
            extensions={extensions}
            onCreate={({ editor }) => {
              editorRef.current = editor;
              documentStore.updateEditor(editor);
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
              documentStore.updateDocumentSaveStatus('Unsaved');
            }}
            slotAfter={<ImageResizer />}
          >
            <CollabEditorCommand entityId={docId} entityType="document" />
            <CollabGenAIMenuSwitch
              contentSelector={{
                text: t('knowledgeBase.context.addToContext'),
                handleClick: () => handleAddToContext(selectedText),
              }}
            />
            <CollabGenAIBlockMenu />
          </EditorContent>
        </EditorRoot>
      </div>
      {contextHolder}
    </div>
  );
};

export const CanvasStatusBar = ({
  deckSize,
  setDeckSize,
}: {
  deckSize: number;
  setDeckSize: (size: number) => void;
}) => {
  const {
    currentDocument,
    updateCurrentDocument,
    documentServerStatus,
    documentCharsCount,
    documentSaveStatus,
    editor,
    tocItems,
  } = useDocumentStoreShallow((state) => ({
    currentDocument: state.currentDocument,
    updateCurrentDocument: state.updateCurrentDocument,
    documentServerStatus: state.documentServerStatus,
    documentCharsCount: state.documentCharsCount,
    documentSaveStatus: state.documentSaveStatus,
    editor: state.editor,
    tocItems: state.tocItems,
  }));
  const { handleDeleteTab } = useCanvasTabs();
  const { t } = useTranslation();

  const { createShare } = useHandleShare();
  const [shareLoading, setShareLoading] = useState(false);
  const handleShare = async () => {
    setShareLoading(true);
    await createShare({
      entityType: 'document',
      entityId: currentDocument?.docId,
      shareCode: currentDocument?.shareCode || undefined,
    });
    setShareLoading(false);
  };

  return (
    <div className="note-status-bar">
      <div className="note-status-bar-menu">
        {/* {canvasServerStatus === 'connected' ? (
          <div className="note-status-bar-item">
            <AiOutlineFileWord />
            <p className="conv-title">{t('knowledgeBase.note.noteCharsCount', { count: noteCharsCount })}</p>
          </div>
        ) : null} */}
        {documentServerStatus === 'connected' ? (
          <div className="note-status-bar-item">
            <HiOutlineClock />
            <p className="conv-title">
              {documentSaveStatus === 'Saved' ? t('knowledgeBase.note.autoSaved') : t('knowledgeBase.note.saving')}
            </p>
          </div>
        ) : null}

        {documentServerStatus === 'disconnected' ? (
          <div className="note-status-bar-item">
            <AiOutlineWarning />
            <p className="conv-title">{t('knowledgeBase.note.serviceDisconnected')}</p>
          </div>
        ) : null}
      </div>

      <div className="note-status-bar-menu">
        <div className="note-status-bar-item" style={{ display: 'flex', alignItems: 'center' }}>
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
            <Button type="text" style={{ width: 32, height: 32 }} icon={<IconBook style={{ fontSize: 16 }} />} />
          </Popover>
          <Divider type="vertical" />
        </div>
        <Button
          type="text"
          size="small"
          style={{ color: deckSize ? '#00968F' : '' }}
          icon={<IconQuote />}
          onClick={() => {
            setDeckSize(deckSize ? 0 : 200);
          }}
        ></Button>
        <Divider type="vertical" />
        <Button
          type="text"
          size="small"
          style={{ color: currentDocument?.shareCode ? '#00968F' : '' }}
          loading={shareLoading}
          icon={<HiOutlineShare />}
          onClick={handleShare}
        >
          {currentDocument?.shareCode ? t('projectDetail.share.sharing') : t('common.share')}
        </Button>
        <Divider type="vertical" />

        {currentDocument && documentServerStatus === 'connected' ? (
          <div
            className="note-status-bar-item"
            onClick={() => {
              updateCurrentDocument({ ...currentDocument, readOnly: !currentDocument?.readOnly });
              currentDocument?.readOnly
                ? message.success(t('knowledgeBase.note.edit'))
                : message.warning(t('knowledgeBase.note.readOnly'));
            }}
          >
            <Button
              type="text"
              style={{ width: 32, height: 32 }}
              icon={
                currentDocument?.readOnly ? <HiOutlineLockClosed style={{ color: '#00968F' }} /> : <HiOutlineLockOpen />
              }
            />
          </div>
        ) : null}
        <div className="note-status-bar-item">
          <Divider type="vertical" />
          <DeleteDropdownMenu
            type="document"
            canCopy={true}
            data={currentDocument}
            postDeleteList={(document: Document) => handleDeleteTab(document.docId)}
          />
        </div>
      </div>
    </div>
  );
};

export const DocumentEditorHeader = () => {
  const { currentDocument, updateCurrentDocument } = useDocumentStoreShallow((state) => ({
    currentDocument: state.currentDocument,
    updateCurrentDocument: state.updateCurrentDocument,
  }));

  const onTitleChange = (newTitle: string) => {
    const currentDocument = useDocumentStore.getState().currentDocument;

    if (!currentDocument) {
      return;
    }

    updateCurrentDocument({ ...currentDocument, title: newTitle });
  };

  useEffect(() => {
    editorEmitter.on('updateCanvasTitle', onTitleChange);

    return () => {
      editorEmitter.off('updateCanvasTitle', onTitleChange);
    };
  }, []);

  const title = currentDocument?.title;

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

export const DocumentEditor = (props: { docId: string; deckSize: number; setDeckSize: (size: number) => void }) => {
  const { docId, deckSize, setDeckSize } = props;

  const { t } = useTranslation();

  const {
    currentDocument: document,
    isRequesting,
    documentServerStatus,
    updateCurrentDocument,
    updateIsRequesting,
    updateDocumentServerStatus,
    resetState,
  } = useDocumentStoreShallow((state) => ({
    currentDocument: state.currentDocument,
    isRequesting: state.isRequesting,
    newDocumentCreating: state.newDocumentCreating,
    documentServerStatus: state.documentServerStatus,
    updateCurrentDocument: state.updateCurrentDocument,
    updateIsRequesting: state.updateIsRequesting,
    updateDocumentServerStatus: state.updateDocumentServerStatus,
    resetState: state.resetState,
  }));
  const prevNote = useRef<Document>();

  useEffect(() => {
    return () => {
      resetState();
    };
  }, []);

  useEffect(() => {
    // updateCurrentCanvas(null);

    const fetchData = async () => {
      updateIsRequesting(true);
      const { data } = await getClient().getDocumentDetail({
        query: { docId },
      });
      const document = data?.data;
      if (document) {
        updateCurrentDocument(document);
        updateIsRequesting(false);
      }
    };
    if (docId && document?.docId !== docId) {
      fetchData();
    }

    return () => {
      updateIsRequesting(false);
    };
  }, [docId, document?.docId]);

  const debouncedUpdateDocument = useDebouncedCallback(async (document: Document) => {
    const res = await getClient().updateDocument({
      body: {
        docId: document.docId,
        title: document.title,
        readOnly: document.readOnly,
      },
    });
    if (res.error) {
      console.error(res.error);
      return;
    }
  }, 500);

  useEffect(() => {
    if (document && prevNote.current?.docId === document.docId) {
      debouncedUpdateDocument(document);
    }
    prevNote.current = document;
  }, [document, debouncedUpdateDocument]);

  return (
    <div className="flex flex-col ai-note-container">
      <CanvasStatusBar deckSize={deckSize} setDeckSize={setDeckSize} />
      <div className="overflow-auto flex-grow">
        <Spin
          className="document-editor-spin"
          tip={t('knowledgeBase.note.connecting')}
          loading={!document || isRequesting || documentServerStatus !== 'connected'}
          style={{ height: '100%', width: '100%' }}
        >
          <div className="ai-note-editor">
            <div className="ai-note-editor-container">
              <DocumentEditorHeader />
              <CollaborativeEditor docId={docId} />
            </div>
          </div>
        </Spin>
      </div>
    </div>
  );
};
