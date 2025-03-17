import { EditorBubble, useEditor } from '../../../core/components';
import { removeAIHighlight } from '../../../core/extensions';
import { type ReactNode, useEffect, useMemo, useRef } from 'react';
import type { Instance } from 'tippy.js';

import { AISelector } from '../common/ai-selector';
import { editorEmitter } from '@refly-packages/utils/event-emitter/editor';

interface GenerativeMenuSwitchProps {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GenerativeMenuSwitch = ({ children, open, onOpenChange }: GenerativeMenuSwitchProps) => {
  const { editor } = useEditor();
  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<Instance | null>(null);

  const isTableCellOrHeader = useMemo(() => {
    if (!editor) return false;
    return editor.isActive('tableCell') || editor.isActive('tableHeader');
  }, [editor, editor?.state.selection]);

  const handleBubbleClose = () => {
    if (bubbleRef.current) {
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

  useEffect(() => {
    const handleInitialCleanup = () => {
      if (editor) {
        removeAIHighlight(editor);
      }
    };

    editorEmitter.on('editorSynced', handleInitialCleanup);
    return () => {
      editorEmitter.off('editorSynced', handleInitialCleanup);
    };
  }, [editor]);

  useEffect(() => {
    return () => {
      handleBubbleHide();
    };
  }, []);

  return (
    <div ref={containerRef}>
      <EditorBubble
        tippyOptions={{
          placement: open ? 'bottom-start' : 'top',
          onHidden: () => {
            handleBubbleHide();
          },
          onCreate: (instance) => {
            bubbleRef.current = instance;
          },
          maxWidth: '90vw',
          appendTo: containerRef.current || 'parent',
        }}
        className="flex items-center overflow-hidden z-50 max-w-full rounded-md border border-solid border-gray-200 shadow-xl bg-background"
      >
        {open && (
          <AISelector
            open={open}
            onOpenChange={onOpenChange}
            handleBubbleClose={handleBubbleClose}
            inPlaceEditType="inline"
          />
        )}
        {/* TODO: fix this dont show menu when table is selected */}
        {!open && !isTableCellOrHeader && children}
      </EditorBubble>
    </div>
  );
};

export default GenerativeMenuSwitch;
