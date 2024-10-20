import { memo, useEffect, useMemo, useRef, useState } from 'react';
import wordsCount from 'words-count';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { Canvas } from '@refly/openapi-schema';

import './index.scss';
import { useCookie } from 'react-use';
import { Button, Divider, Input, Popover, Spin, Switch, Tabs, Tooltip } from '@arco-design/web-react';
import { HiOutlineLockClosed, HiOutlineLockOpen, HiOutlineClock } from 'react-icons/hi2';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { editorEmitter } from '@refly-packages/ai-workspace-common/utils/event-emitter/editor';

import {
  CollabEditorCommand,
  CollabGenAIMenuSwitch,
  CollabGenAIBlockMenu,
} from '@refly-packages/editor-component/advanced-editor';
import { EditorRoot } from '@refly-packages/editor-core/components';
import { EditorContent, EditorInstance } from '@refly-packages/editor-core/components';
import { DeleteDropdownMenu } from '@refly-packages/ai-workspace-common/components/knowledge-base/delete-dropdown-menu';
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
import { useSearchStore } from '@refly-packages/ai-workspace-common/stores/search';
import { getClientOrigin, getWsServerOrigin } from '@refly-packages/utils/url';
import { useCanvasStore } from '@refly-packages/ai-workspace-common/stores/canvas';
import { useCanvasTabs } from '@refly-packages/ai-workspace-common/hooks/use-note-tabs';
import { useAINote } from '@refly-packages/ai-workspace-common/hooks/use-ai-note';
import { AINoteEmpty } from '@refly-packages/ai-workspace-common/components/knowledge-base/ai-note-empty';

// content selector
import { useContentSelector } from '@refly-packages/ai-workspace-common/modules/content-selector/hooks/use-content-selector';
import '@refly-packages/ai-workspace-common/modules/content-selector/styles/content-selector.scss';
import classNames from 'classnames';
import { useContentSelectorStore } from '@refly-packages/ai-workspace-common/modules/content-selector/stores/content-selector';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
// componets
import { ToC } from './ToC';
import { IconBook, IconLoading, IconPlus, IconSearch } from '@arco-design/web-react/icon';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';

const MemorizedToC = memo(ToC);

const CollaborativeEditor = ({ canvasId }: { canvasId: string }) => {
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
      url: `${baseUrl}/knowledge-base?noteId=${canvasId}`,
    },
  );

  const websocketProvider = useMemo(() => {
    return new HocuspocusProvider({
      url: getWsServerOrigin(),
      name: canvasId,
      token,
    });
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
    // Update status changes
    websocketProvider.on('status', (event) => {
      canvasStore.updateCanvasServerStatus(event.status);
    });

    return () => {
      websocketProvider.forceSync();
      websocketProvider.destroy();
      editorRef.current?.destroy();
    };
  }, []);

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

interface AINoteStatusBarProps {}

export const AINoteStatusBar = (props: AINoteStatusBarProps) => {
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
            type="note"
            canCopy={true}
            data={currentCanvas}
            postDeleteList={(canvas: Canvas) => handleDeleteTab(canvas.canvasId)}
          />
        </div>
      </div>
    </div>
  );
};

interface AINoteHeaderProps {}

export const AINoteHeader = (props: AINoteHeaderProps) => {
  const { currentCanvas, updateCurrentCanvas, tabs, activeTab } = useCanvasStore((state) => ({
    tabs: state.tabs,
    activeTab: state.activeTab,
    currentCanvas: state.currentCanvas,
    updateCurrentCanvas: state.updateCurrentCanvas,
  }));
  const { handleUpdateTabTitle } = useCanvasTabs();

  const onTitleChange = (newTitle: string) => {
    updateCurrentCanvas({ ...currentCanvas, title: newTitle });
    handleUpdateTabTitle(currentCanvas.canvasId, newTitle);
  };

  const title = tabs.find((tab) => tab.key === activeTab)?.title || currentCanvas?.title;

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

export const AINote = () => {
  const [searchParams] = useSearchParams();
  const canvasId = searchParams.get('noteId');

  const { t } = useTranslation();

  const { handleInitEmptyNote } = useAINote();
  const {
    currentCanvas: canvas,
    isRequesting,
    newNoteCreating,
    canvasServerStatus,
    updateCurrentCanvas,
    updateIsRequesting,
    updateNotePanelVisible,
    updateCanvasServerStatus,
    resetState,
  } = useCanvasStore((state) => ({
    currentCanvas: state.currentCanvas,
    isRequesting: state.isRequesting,
    newNoteCreating: state.newCanvasCreating,
    canvasServerStatus: state.canvasServerStatus,
    updateCurrentCanvas: state.updateCurrentCanvas,
    updateIsRequesting: state.updateIsRequesting,
    updateNotePanelVisible: state.updateCanvasPanelVisible,
    updateCanvasServerStatus: state.updateCanvasServerStatus,
    resetState: state.resetState,
  }));
  const prevNote = useRef<Canvas>();

  const searchStore = useSearchStore();

  const { tabs, activeTab, setActiveTab, handleDeleteTab, handleAddTab } = useCanvasTabs();

  useEffect(() => {
    return () => {
      resetState();
    };
  }, []);

  useEffect(() => {
    updateCurrentCanvas(null);
    updateNotePanelVisible(true);
    updateCanvasServerStatus('disconnected');

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
      if (!tabs.some((tab) => tab.key === canvasId)) {
        handleAddTab({
          title: canvas.title,
          key: canvas.canvasId,
          content: canvas.contentPreview || '',
          canvasId: canvas.canvasId,
        });
      }
    };
    if (canvasId) {
      fetchData();
    }

    return () => {
      updateIsRequesting(false);
      updateNotePanelVisible(false);
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

  if (canvasId === undefined || canvasId == null || canvasId === '') {
    return <AINoteEmpty />;
  }

  return (
    <div className="ai-note-container">
      <Tabs
        editable
        addButton={
          <Button
            type="text"
            size="small"
            shape="circle"
            disabled={newNoteCreating}
            icon={newNoteCreating ? <IconLoading /> : <IconPlus />}
          />
        }
        type="card-gutter"
        className="note-detail-tab-container"
        activeTab={activeTab}
        onDeleteTab={handleDeleteTab}
        onAddTab={() => handleInitEmptyNote('')}
        onChange={setActiveTab}
        renderTabHeader={(props, DefaultTabHeader) => {
          return (
            <div className="note-detail-header">
              <div className="note-detail-nav-switcher">
                <DefaultTabHeader {...props} />
              </div>
              <div className="note-detail-navigation-bar">
                <Tooltip content={t('knowledgeBase.header.searchOrOpenNote')} getPopupContainer={getPopupContainer}>
                  <Button
                    icon={<IconSearch />}
                    type="text"
                    style={{ marginRight: 4 }}
                    className="assist-action-item-header"
                    onClick={() => {
                      searchStore.setPages(searchStore.pages.concat('note'));
                      searchStore.setIsSearchOpen(true);
                    }}
                  ></Button>
                </Tooltip>
              </div>
            </div>
          );
        }}
      >
        {tabs.map((tab, i) => (
          <Tabs.TabPane destroyOnHide key={tab.key} title={tab.title}>
            <div></div>
          </Tabs.TabPane>
        ))}
      </Tabs>
      <Spin
        tip={t('knowledgeBase.note.connecting')}
        loading={!canvas || isRequesting || canvasServerStatus !== 'connected'}
        style={{ height: '100%', width: '100%' }}
      >
        <div className="ai-note-editor">
          <div className="ai-note-editor-container">
            <AINoteHeader />
            <CollaborativeEditor key={canvasId} canvasId={canvasId} />
          </div>
        </div>
      </Spin>
      <AINoteStatusBar />
    </div>
  );
};
