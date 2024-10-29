import { Editor, useEditor, EditorBubble } from '@refly-packages/editor-core/components';
import { removeAIHighlight } from '@refly-packages/editor-core/extensions';
import { useEffect, useRef } from 'react';
import { AIBlockSelector } from './ai-block-selector';
import { editorEmitter } from '@refly/utils/event-emitter/editor';
import type { Instance } from 'tippy.js';

import { posToDOMRect } from '@tiptap/react';

interface GenerativeBlockMenuSwitchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const GenerativeBlockMenuSwitch = ({ open, onOpenChange }: GenerativeBlockMenuSwitchProps) => {
  const { editor } = useEditor();
  const bubbleRef = useRef<Instance | null>(null);
  const editorRef = useRef<Editor | null>(null);

  // useEffect(() => {
  //   if (!open) removeAIHighlight(editor);
  // }, [open]);

  const handleHideBubble = () => {
    onOpenChange(false);
    editor.chain().unsetHighlight().run();
    removeAIHighlight(editor);
  };

  useEffect(() => {
    editorEmitter.on('activeAskAI', (value: boolean) => {
      onOpenChange(value);

      if (!value) {
        bubbleRef.current?.hide();
      } else {
        const editor = editorRef.current;
        const pos = editor.state.selection.from;

        // 2. 设置选区并等待 DOM 更新
        editor.commands.setTextSelection(pos);

        // 3. 等待 DOM 更新后再显示气泡
        requestAnimationFrame(() => {
          if (bubbleRef.current) {
            // 强制更新参考元素位置
            const { state } = editor;
            const { view } = editor;
            const { selection } = state;
            const { from, to } = selection;

            bubbleRef.current.setProps({
              getReferenceClientRect: () => posToDOMRect(view, from, to),
            });

            // 更新位置后再显示
            bubbleRef.current.show();

            // 强制更新弹出位置
            bubbleRef.current.popperInstance?.update();
          }
        });
      }
    });
    return () => {
      editorEmitter.off('activeAskAI');
    };
  }, []);

  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
    }
  }, [editor]);

  return (
    <EditorBubble
      tippyOptions={{
        placement: open ? 'bottom-start' : 'top',
        onHidden: handleHideBubble,
        onCreate: (instance) => {
          bubbleRef.current = instance;
        },
      }}
      className="z-50 flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
    >
      {open && <AIBlockSelector open={open} onOpenChange={onOpenChange} />}
    </EditorBubble>
  );
};

export default GenerativeBlockMenuSwitch;
