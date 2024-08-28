import { EditorBubble, useEditor } from '@refly-packages/editor-core/components';
import { removeAIHighlight } from '@refly-packages/editor-core/extensions';
import { Fragment, type ReactNode, useEffect } from 'react';
import { AISelector } from '@refly-packages/editor-component/generative/ai-selector';

interface GenerativeMenuSwitchProps {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GenerativeMenuSwitch = ({ children, open, onOpenChange }: GenerativeMenuSwitchProps) => {
  const { editor } = useEditor();

  useEffect(() => {
    if (!open) removeAIHighlight(editor);
  }, [open]);

  return (
    <EditorBubble
      tippyOptions={{
        placement: open ? 'bottom-start' : 'top',
        onHidden: () => {
          onOpenChange(false);
          editor.chain().unsetHighlight().run();
        },
      }}
      className="z-50 flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
    >
      {open && <AISelector open={open} onOpenChange={onOpenChange} />}
      {!open && <Fragment>{children}</Fragment>}
    </EditorBubble>
  );
};

export default GenerativeMenuSwitch;
