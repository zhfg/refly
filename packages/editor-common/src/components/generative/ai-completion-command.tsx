import { CommandGroup, CommandItem, CommandSeparator } from '../ui/command';
import { useEditor } from '@refly-packages/editor-core/components';
import { editorEmitter } from '@refly-packages/editor-core/utils/event';
import { Check, TextQuote, TrashIcon } from 'lucide-react';
import { useEffect } from 'react';

const AICompletionCommands = ({
  completion,
  onDiscard,
  onOpenChange,
}: {
  completion: string;
  onDiscard: () => void;
  onOpenChange: (open: boolean) => void;
}) => {
  const { editor } = useEditor();

  return (
    <>
      <CommandGroup>
        <CommandItem
          className="gap-2 px-4"
          value="replace"
          onSelect={() => {
            if (!editor) return;

            const selection = editor.view?.state?.selection;

            if (selection) {
              editor
                .chain()
                .focus()
                // .unsetAIHighlight()
                .insertContentAt(
                  {
                    from: selection.from,
                    to: selection.to,
                  },
                  completion,
                )
                .run();
              editorEmitter.emit('activeAskAI', false);
            }
          }}
        >
          <Check className="w-4 h-4 text-muted-foreground" />
          Replace selection
        </CommandItem>
        <CommandItem
          className="gap-2 px-4"
          value="insert"
          onSelect={() => {
            if (!editor) return;

            const selection = editor.view?.state?.selection;

            if (selection) {
              editor
                .chain()
                .focus()
                // .unsetAIHighlight()
                .insertContentAt(selection.to + 1, completion)
                .run();

              editorEmitter.emit('activeAskAI', false);
              // onOpenChange(false)
            }
          }}
        >
          <TextQuote className="w-4 h-4 text-muted-foreground" />
          Insert below
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />

      <CommandGroup>
        <CommandItem onSelect={onDiscard} value="thrash" className="gap-2 px-4">
          <TrashIcon className="w-4 h-4 text-muted-foreground" />
          Discard
        </CommandItem>
      </CommandGroup>
    </>
  );
};

export default AICompletionCommands;
