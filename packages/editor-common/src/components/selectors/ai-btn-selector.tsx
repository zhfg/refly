import { PopoverContent } from '../ui/popover';
import { Popover, PopoverTrigger } from '@radix-ui/react-popover';
import { useEditor } from '@refly-packages/editor-core/components';
import { useEffect, useRef } from 'react';
import Magic from '../ui/icons/magic';
import { Button } from '../ui/button';

import { AISelector } from '../generative/ai-selector';

interface AIBtnSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AIBtnSelector = ({ open, onOpenChange }: AIBtnSelectorProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { editor } = useEditor();

  // Autofocus on input by default
  useEffect(() => {
    inputRef.current?.focus();
  });
  if (!editor) return null;

  return (
    <Popover modal={true} open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          className="gap-1 rounded-none text-purple-500"
          variant="ghost"
          onClick={() => onOpenChange(true)}
          size="sm"
        >
          <Magic className="h-5 w-5" />
          Ask AI
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-0" sideOffset={10}>
        <AISelector open={open} onOpenChange={onOpenChange} />
      </PopoverContent>
    </Popover>
  );
};
