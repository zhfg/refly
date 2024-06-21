import { CommandGroup, CommandItem, CommandSeparator } from "../ui/command"
import { useEditor } from "@refly-packages/editor-core/components"
import { Check, TextQuote, TrashIcon } from "lucide-react"
import { useEffect } from "react"

const AICompletionCommands = ({
  completion,
  onDiscard,
  onOpenChange,
}: {
  completion: string
  onDiscard: () => void
  onOpenChange: (open: boolean) => void
}) => {
  const { editor } = useEditor()

  return (
    <>
      <CommandGroup>
        <CommandItem
          className="gap-2 px-4"
          value="replace"
          onSelect={() => {
            const selection = editor.view.state.selection

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
              .run()
          }}>
          <Check className="h-4 w-4 text-muted-foreground" />
          Replace selection
        </CommandItem>
        <CommandItem
          className="gap-2 px-4"
          value="insert"
          onSelect={() => {
            const selection = editor.view.state.selection
            editor
              .chain()
              .focus()
              // .unsetAIHighlight()
              .insertContentAt(selection.to + 1, completion)
              .run()

            // onOpenChange(false)
          }}>
          <TextQuote className="h-4 w-4 text-muted-foreground" />
          Insert below
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />

      <CommandGroup>
        <CommandItem onSelect={onDiscard} value="thrash" className="gap-2 px-4">
          <TrashIcon className="h-4 w-4 text-muted-foreground" />
          Discard
        </CommandItem>
      </CommandGroup>
    </>
  )
}

export default AICompletionCommands
