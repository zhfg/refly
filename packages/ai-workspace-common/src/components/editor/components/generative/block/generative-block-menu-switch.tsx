import {
  Editor,
  useEditor,
  EditorBubble,
} from '@refly-packages/ai-workspace-common/components/editor/core/components';
import { removeAIHighlight } from '@refly-packages/ai-workspace-common/components/editor/core/extensions';
import { useEffect, useRef } from 'react';
import { AISelector } from '../common/ai-selector';
import { editorEmitter } from '@refly/utils/event-emitter/editor';
import type { Instance } from 'tippy.js';

import { posToDOMRect } from '@tiptap/react';
import { useDocumentStoreShallow } from '@refly-packages/ai-workspace-common/stores/document';

interface GenerativeBlockMenuSwitchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const GenerativeBlockMenuSwitch = ({ open, onOpenChange }: GenerativeBlockMenuSwitchProps) => {
  const { editor } = useEditor();
  const bubbleRef = useRef<Instance | null>(null);
  const editorRef = useRef<Editor | null>(null);

  const docId = editor?.options?.editorProps?.attributes?.['data-doc-id'];
  const { activeDocumentId } = useDocumentStoreShallow((state) => ({
    activeDocumentId: state.activeDocumentId,
  }));

  useEffect(() => {
    if (activeDocumentId && activeDocumentId !== docId) {
      editorEmitter.emit('activeAskAI', { value: false, docId });
    }
  }, [activeDocumentId, docId]);

  useEffect(() => {
    if (!open) removeAIHighlight(editor);
  }, [open]);

  const handleBubbleClose = () => {
    if (bubbleRef.current) {
      // bubbleRef.current?.hide();
      // bubbleRef.current.popperInstance?.update();

      handleBubbleHide();

      requestAnimationFrame(() => {
        editor.chain().setTextSelection(editor.state.selection.from).run();
      });
    }
  };

  const handleBubbleHide = () => {
    onOpenChange(false);
    editor.chain().unsetHighlight().run();
    removeAIHighlight(editor);
  };

  const handleAskAI = ({ value, docId: eventDocId }: { value: boolean; docId?: string }) => {
    if (eventDocId && eventDocId !== docId) {
      return;
    }

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
  };

  useEffect(() => {
    editorEmitter.on('activeAskAI', handleAskAI);
    return () => {
      editorEmitter.off('activeAskAI', handleAskAI);
    };
  }, [docId]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
        editorEmitter.emit('activeAskAI', { value: false, docId });
        // Focus editor after closing AI selector
        setTimeout(() => {
          editor?.commands.focus();
        }, 0);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onOpenChange, editor]);

  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
    }

    return () => {
      removeAIHighlight(editor);
      handleBubbleHide();
    };
  }, [editor]);

  return (
    <EditorBubble
      tippyOptions={{
        placement: open ? 'bottom-start' : 'top',
        onHidden: () => {
          handleBubbleHide();
        },
        onCreate: (instance) => {
          bubbleRef.current = instance;
        },
      }}
      className="z-50 flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-solid border-[rgba(0,0,0,0.1)] bg-background shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
    >
      {open && (
        <AISelector
          open={open}
          onOpenChange={onOpenChange}
          inPlaceEditType="block"
          handleBubbleClose={handleBubbleClose}
        />
      )}
    </EditorBubble>
  );
};

export default GenerativeBlockMenuSwitch;
