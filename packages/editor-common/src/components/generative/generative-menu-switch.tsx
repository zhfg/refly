import { EditorBubble, useEditor } from '@refly-packages/editor-core/components';
import { removeAIHighlight } from '@refly-packages/editor-core/extensions';
import { Fragment, type ReactNode, useEffect, useRef } from 'react';
import { AISelector } from '@refly-packages/editor-component/generative/ai-selector';

interface GenerativeMenuSwitchProps {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GenerativeMenuSwitch = ({ children, open, onOpenChange }: GenerativeMenuSwitchProps) => {
  const { editor } = useEditor();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) removeAIHighlight(editor);
  }, [open]);

  return (
    <div ref={containerRef}>
      <EditorBubble
        tippyOptions={{
          placement: open ? 'bottom-start' : 'top',
          onHidden: () => {
            onOpenChange(false);
            editor.chain().unsetHighlight().run();
          },
          maxWidth: '90vw',
          appendTo: containerRef.current || 'parent',
        }}
        className="z-50 flex w-fit max-w-full overflow-hidden rounded-md border border-muted bg-background shadow-xl"
      >
        {open && <AISelector open={open} onOpenChange={onOpenChange} />}
        {!open && <Fragment>{children}</Fragment>}
      </EditorBubble>
    </div>
  );
};

export default GenerativeMenuSwitch;
