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
  private isInMark: boolean;
  private isInBulletList: boolean;

  constructor() {
    this.chunk = '';
    this.isLineStart = true;
    this.isInBulletList = false;
  }

  setEditor(editor: EditorInstance) {
    this.editor = editor;
  }

  process(content: string) {
    if (!this.editor) {
      return;
    }

    this.chunk += content;
    console.log(
      'process',
      JSON.stringify({
        content,
        chunk: this.chunk,
        isLineStart: this.isLineStart,
        isInBulletList: this.isInBulletList,
      }),
    );

    if (content === ' ') {
      return;
    }

    // Could be a list item, wait for the next token
    if (content === '-' || content === '*') {
      return;
    }

    // Could be a heading
    if (content.startsWith('#')) {
      return;
    }

    if (content.includes('\n')) {
      const lines = this.chunk.replace(/\n+/g, '\n').split('\n');
      lines.forEach((line, index) => {
        if (line) {
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
      console.log('chunk could be </reflyCanvas>', this.chunk);
      return;
    }

    if (this.isLineStart) {
      if (this.chunk.startsWith('- ') || this.chunk.startsWith('* ')) {
        // List item
        if (!this.isInBulletList) {
          this.isInBulletList = true;
          console.log('set isInBulletList to true');
        } else {
          this.chunk = this.chunk.substring(2);
          console.log('already in isInBulletList, modify chunk to', JSON.stringify({ chunk: this.chunk }));
        }
      } else {
        if (this.isInBulletList) {
          this.isInBulletList = false;
          this.editor.commands.enter();
          console.log('set isInBulletList to false, enter to exit bullet list');
        }
      }

      console.log('insertChunk at line start', JSON.stringify({ chunk: this.chunk }));
      this.editor.commands.insertContent(this.chunk);
      this.chunk = '';
      this.isLineStart = false;
      return;
    }

    console.log('insertChunk', JSON.stringify({ chunk: this.chunk }));
    this.editor.commands.insertContent(this.chunk);
    this.chunk = '';
  }
}

const testContent = [
  {
    content: '\n',
  },
  {
    content: '#',
  },
  {
    content: ' 寻',
  },
  {
    content: '人',
  },
  {
    content: '启',
  },
  {
    content: '事',
  },
  {
    content: '\n\n',
  },
  {
    content: '##',
  },
  {
    content: ' ',
  },
  {
    content: '失',
  },
  {
    content: '踪',
  },
  {
    content: '人员',
  },
  {
    content: '信息',
  },
  {
    content: '\n',
  },
  {
    content: '-',
  },
  {
    content: ' **',
  },
  {
    content: '姓名',
  },
  {
    content: '**',
  },
  {
    content: '：',
  },
  {
    content: '张',
  },
  {
    content: '三',
  },
  {
    content: '\n',
  },
  {
    content: '-',
  },
  {
    content: ' **',
  },
  {
    content: '性',
  },
  {
    content: '别',
  },
  {
    content: '**',
  },
  {
    content: '：',
  },
  {
    content: '男',
  },
  {
    content: '\n',
  },
  {
    content: '-',
  },
  {
    content: ' **',
  },
  {
    content: '年龄',
  },
  {
    content: '**',
  },
  {
    content: '：',
  },
  {
    content: '28',
  },
  {
    content: '岁',
  },
  {
    content: '\n',
  },
  {
    content: '-',
  },
  {
    content: ' **',
  },
  {
    content: '身',
  },
  {
    content: '高',
  },
  {
    content: '**',
  },
  {
    content: '：',
  },
  {
    content: '175',
  },
  {
    content: '厘米',
  },
  {
    content: '\n',
  },
  {
    content: '-',
  },
  {
    content: ' **',
  },
  {
    content: '体',
  },
  {
    content: '重',
  },
  {
    content: '**',
  },
  {
    content: '：',
  },
  {
    content: '70',
  },
  {
    content: '公斤',
  },
  {
    content: '\n',
  },
  {
    content: '-',
  },
  {
    content: ' **',
  },
  {
    content: '外',
  },
  {
    content: '貌',
  },
  {
    content: '特',
  },
  {
    content: '征',
  },
  {
    content: '**',
  },
  {
    content: '：',
  },
  {
    content: '短',
  },
  {
    content: '发',
  },
  {
    content: '，',
  },
  {
    content: '戴',
  },
  {
    content: '眼',
  },
  {
    content: '镜',
  },
  {
    content: '，',
  },
  {
    content: '左',
  },
  {
    content: '手',
  },
  {
    content: '有',
  },
  {
    content: '一个',
  },
  {
    content: '小',
  },
  {
    content: '伤',
  },
  {
    content: '疤',
  },
  {
    content: '\n\n',
  },
  {
    content: '##',
  },
  {
    content: ' ',
  },
  {
    content: '失',
  },
  {
    content: '踪',
  },
  {
    content: '情况',
  },
  {
    content: '\n',
  },
  {
    content: '张',
  },
  {
    content: '三',
  },
  {
    content: '于',
  },
  {
    content: '202',
  },
  {
    content: '3',
  },
  {
    content: '年',
  },
  {
    content: '10',
  },
  {
    content: '月',
  },
  {
    content: '15',
  },
  {
    content: '日下午',
  },
  {
    content: '3',
  },
  {
    content: '点',
  },
  {
    content: '在',
  },
  {
    content: '北京市',
  },
  {
    content: '朝',
  },
  {
    content: '阳',
  },
  {
    content: '区',
  },
  {
    content: '某',
  },
  {
    content: '咖',
  },
  {
    content: '啡',
  },
  {
    content: '馆',
  },
  {
    content: '离',
  },
  {
    content: '开',
  },
  {
    content: '后',
  },
  {
    content: '失',
  },
  {
    content: '联',
  },
  {
    content: '，',
  },
  {
    content: '至',
  },
  {
    content: '今',
  },
  {
    content: '未',
  },
  {
    content: '归',
  },
  {
    content: '。',
  },
  {
    content: '最后',
  },
  {
    content: '一次',
  },
  {
    content: '被',
  },
  {
    content: '人',
  },
  {
    content: '目',
  },
  {
    content: '击',
  },
  {
    content: '是在',
  },
  {
    content: '附近',
  },
  {
    content: '的',
  },
  {
    content: '公',
  },
  {
    content: '园',
  },
  {
    content: '。\n\n',
  },
  {
    content: '##',
  },
  {
    content: ' 联系',
  },
  {
    content: '方式',
  },
  {
    content: '\n',
  },
  {
    content: '如',
  },
  {
    content: '有',
  },
  {
    content: '任何',
  },
  {
    content: '线',
  },
  {
    content: '索',
  },
  {
    content: '，请',
  },
  {
    content: '及时',
  },
  {
    content: '与',
  },
  {
    content: '我们',
  },
  {
    content: '联系',
  },
  {
    content: '：\n',
  },
  {
    content: '-',
  },
  {
    content: ' **',
  },
  {
    content: '联系人',
  },
  {
    content: '**',
  },
  {
    content: '：',
  },
  {
    content: '李',
  },
  {
    content: '四',
  },
  {
    content: '\n',
  },
  {
    content: '-',
  },
  {
    content: ' **',
  },
  {
    content: '联系电话',
  },
  {
    content: '**',
  },
  {
    content: '：',
  },
  {
    content: '138',
  },
  {
    content: '-',
  },
  {
    content: 'XXXX',
  },
  {
    content: '-',
  },
  {
    content: 'XXXX',
  },
  {
    content: '\n',
  },
  {
    content: '-',
  },
  {
    content: ' **',
  },
  {
    content: '电子',
  },
  {
    content: '邮箱',
  },
  {
    content: '**',
  },
  {
    content: '：',
  },
  {
    content: 'example',
  },
  {
    content: '@example',
  },
  {
    content: '.com',
  },
  {
    content: '\n\n',
  },
  {
    content: '我们',
  },
  {
    content: '非常',
  },
  {
    content: '担',
  },
  {
    content: '心',
  },
  {
    content: '张',
  },
  {
    content: '三',
  },
  {
    content: '的',
  },
  {
    content: '安全',
  },
  {
    content: '，希望',
  },
  {
    content: '大家',
  },
  {
    content: '能够',
  },
  {
    content: '积极',
  },
  {
    content: '提供',
  },
  {
    content: '线',
  },
  {
    content: '索',
  },
  {
    content: '，',
  },
  {
    content: '感谢',
  },
  {
    content: '您的',
  },
  {
    content: '帮助',
  },
  {
    content: '！\n',
  },
  {
    content: '</',
  },
  {
    content: 'ref',
  },
  {
    content: 'ly',
  },
  {
    content: 'Canvas',
  },
];

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

  const insertContent = () => {
    // editorRef.current.commands.insertContent('**world**');
    editorRef.current.commands.insertContent('- **hello**');
    return;

    editorRef.current.commands.enter();

    editorRef.current.commands.toggleBulletList();
    // editorRef.current.commands.insertContent('-');
    // editorRef.current.commands.insertContent({ type: 'text', text: ' ' });
    editorRef.current.commands.insertContent('foo');
    editorRef.current.commands.insertContent('foo');
    editorRef.current.commands.insertContent('foo');
    editorRef.current.commands.enter();
    editorRef.current.commands.insertContent('bar');
    editorRef.current.commands.enter();
    editorRef.current.commands.toggleBulletList();
    editorRef.current.commands.insertContent('baz');
    // editorRef.current.commands.insertContent('-');
    // // editorRef.current.commands.insertContent({ type: 'text', text: ' ' });
    // editorRef.current.commands.insertContent(' bar');
    // editorRef.current.commands.enter();
  };

  const insertTestContent = async () => {
    if (editorRef.current) {
      processor.setEditor(editorRef.current);

      for (const item of testContent) {
        processor.process(item.content);
        await new Promise((resolve) => setTimeout(resolve, 10));
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
        <Button onClick={insertContent}>test</Button>
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
