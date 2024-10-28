import { CommandGroup, CommandItem, CommandList, CommandSeparator } from '../../ui/command';
import { useEditor } from '@refly-packages/editor-core/components';
import { editorEmitter } from '@refly/utils/event-emitter/editor';
import { Check, TextQuote, TrashIcon } from 'lucide-react';
import { useEffect } from 'react';

const AIBlockCompletionCommands = ({
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
        <CommandList>
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
            Insert
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
        </CommandList>
      </CommandGroup>
      <CommandSeparator />

      <CommandGroup>
        <CommandList>
          <CommandItem onSelect={onDiscard} value="thrash" className="gap-2 px-4">
            <TrashIcon className="w-4 h-4 text-muted-foreground" />
            Discard
          </CommandItem>
        </CommandList>
      </CommandGroup>
    </>
  );
};

export default AIBlockCompletionCommands;
