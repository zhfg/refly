import { EditorBubble, useEditor } from '@refly-packages/editor-core/components';
import { removeAIHighlight } from '@refly-packages/editor-core/extensions';
import { useEffect, useState } from 'react';
import { AIBlockSelector } from './ai-block-selector';
import { editorEmitter } from '@refly/utils/event-emitter/editor';

interface GenerativeBlockMenuSwitchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const GenerativeBlockMenuSwitch = ({ open, onOpenChange }: GenerativeBlockMenuSwitchProps) => {
  const { editor } = useEditor();
  const [askAIShow, setAskAIShow] = useState(false);

  useEffect(() => {
    if (!open) removeAIHighlight(editor);
  }, [open]);

  useEffect(() => {
    editorEmitter.on('activeAskAI', (value: boolean) => {
      onOpenChange(value);
      setAskAIShow(value);
    });
    return () => {
      editorEmitter.off('activeAskAI');
    };
  }, []);

  return (
    <EditorBubble
      tippyOptions={{
        placement: open ? 'bottom-start' : 'top',
        onHidden: () => {
          onOpenChange(false);
          editor.chain().unsetHighlight().run();
        },
      }}
      askAIShow={askAIShow}
      className="z-50 flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
    >
      {open && askAIShow && <AIBlockSelector open={open} onOpenChange={onOpenChange} />}
    </EditorBubble>
  );
};

export default GenerativeBlockMenuSwitch;
