import { EditorBubble, useEditor } from '@refly-packages/editor-core/components';
import { removeAIHighlight } from '@refly-packages/editor-core/extensions';
import { Fragment, type ReactNode, useEffect, useRef } from 'react';
import type { Instance } from 'tippy.js';

import { AISelector } from '../common/ai-selector';

interface GenerativeMenuSwitchProps {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GenerativeMenuSwitch = ({ children, open, onOpenChange }: GenerativeMenuSwitchProps) => {
  const { editor } = useEditor();
  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<Instance | null>(null);

  // useEffect(() => {
  //   if (!open) removeAIHighlight(editor);
  // }, [open]);

  const handleBubbleClose = () => {
    if (bubbleRef.current) {
      // handleBubbleHide();
      // bubbleRef.current?.hide();
    }
  };

  const handleBubbleHide = () => {
    onOpenChange(false);
    editor.chain().unsetHighlight().run();
    removeAIHighlight(editor);
  };

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
        className="flex overflow-hidden z-50 max-w-full rounded-md border shadow-xl w-fit border-muted bg-background"
      >
        {open && (
          <AISelector
            open={open}
            onOpenChange={onOpenChange}
            handleBubbleClose={handleBubbleClose}
            inPlaceEditType="inline"
          />
        )}
        {!open && <Fragment>{children}</Fragment>}
      </EditorBubble>
    </div>
  );
};

export default GenerativeMenuSwitch;
