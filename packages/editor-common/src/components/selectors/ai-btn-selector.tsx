import { PopoverContent } from '../ui/popover';
import { Popover, PopoverTrigger } from '@radix-ui/react-popover';
import { useEditor } from '@refly-packages/editor-core/components';
import { useEffect, useRef } from 'react';
import Magic from '../ui/icons/magic';
import { Button } from '../ui/button';

import { AISelector } from '../generative/common/ai-selector';

interface AIBtnSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AIBtnSelector = ({ open, onOpenChange }: AIBtnSelectorProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { editor } = useEditor();

  // Autofocus on input by default
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  if (!editor) return null;

  return (
    <Popover modal={true} open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          className="gap-1 text-purple-500 rounded-none"
          variant="ghost"
          size="sm"
          onClick={() => onOpenChange(true)}
        >
          <Magic className="w-5 h-5" />
          Ask AI
        </Button>
      </PopoverTrigger>
      {open && (
        <PopoverContent
          align="start"
          className="p-0 w-[350px]"
          sideOffset={10}
          onFocusOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <AISelector open={open} onOpenChange={onOpenChange} />
        </PopoverContent>
      )}
    </Popover>
  );
};
