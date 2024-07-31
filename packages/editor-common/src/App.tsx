import { useEffect, useRef, useState } from 'react';

import './index.scss';
import { useCookie } from 'react-use';
// 编辑器组件
import { CollabEditorCommand, CollabGenAIMenuSwitch } from '@refly-packages/editor-component/advanced-editor';
import { EditorRoot } from '@refly-packages/editor-core/components';
import { EditorContent, type JSONContent, EditorInstance } from '@refly-packages/editor-core/components';
import { ImageResizer, handleCommandNavigation } from '@refly-packages/editor-core/extensions';
import { defaultExtensions } from '@refly-packages/editor-component/extensions';
import { defaultEditorContent } from '@refly-packages/editor-component/data/content';
import { uploadFn } from '@refly-packages/editor-component/image-upload';
import { slashCommand } from '@refly-packages/editor-component/slash-command';
import { useDebouncedCallback } from 'use-debounce';
import { handleImageDrop, handleImagePaste } from '@refly-packages/editor-core/plugins';
// 编辑器样式

const wsUrl = 'ws://localhost:1234';

function App() {
  const lastCursorPosRef = useRef<number>();
  const [token] = useCookie('_refly_ai_sid');
  const editorRef = useRef<EditorInstance>();
  const [initialContent, setInitialContent] = useState<null | JSONContent>(null);
  const [chartsCount, setChartsCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState('Saved');

  // 准备 extensions
  const extensions = [...defaultExtensions, slashCommand];

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
    setChartsCount(editor.storage.characterCount.words());
    window.localStorage.setItem('html-content', highlightCodeblocks(editor.getHTML()));
    window.localStorage.setItem('novel-content', JSON.stringify(json));
    window.localStorage.setItem('markdown', editor.storage.markdown.getMarkdown());
    setSaveStatus('Saved');
  }, 500);

  useEffect(() => {
    const content = window.localStorage.getItem('novel-content');
    if (content) setInitialContent(JSON.parse(content));
    else setInitialContent(defaultEditorContent);
  }, []);

  return (
    <div style={{ width: '100%' }}>
      <EditorRoot>
        <EditorContent
          initialContent={initialContent}
          extensions={extensions}
          onCreate={({ editor }) => (editorRef.current = editor)}
          className="relative w-full h-full max-w-screen-lg border-muted sm:rounded-lg"
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
            debouncedUpdates(editor);
            setSaveStatus('Unsaved');
          }}
          slotAfter={<ImageResizer />}
        >
          <CollabEditorCommand />
          <CollabGenAIMenuSwitch />
        </EditorContent>
      </EditorRoot>
    </div>
  );
}

export default App;
