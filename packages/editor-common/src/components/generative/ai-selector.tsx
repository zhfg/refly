"use client"

import { Command, CommandInput } from "../ui/command"

import { useChat } from "@refly/ai-sdk"
import { ArrowUp } from "lucide-react"
import { useEditor } from "@refly-packages/editor-core/components"
import { addAIHighlight } from "@refly-packages/editor-core/extensions"
import { useState } from "react"
import Markdown from "react-markdown"
import { toast } from "sonner"
import { Button } from "../ui/button"
import CrazySpinner from "../ui/icons/crazy-spinner"
import Magic from "../ui/icons/magic"
import { ScrollArea } from "../ui/scroll-area"
import AICompletionCommands from "./ai-completion-command"
import AISelectorCommands from "./ai-selector-commands"
import { LOCALE } from "@refly/common-types"
import { editorEmitter } from "@refly-packages/editor-core/utils/event"
//TODO: I think it makes more sense to create a custom Tiptap extension for this functionality https://tiptap.dev/docs/editor/ai/introduction

interface AISelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AISelector({ onOpenChange }: AISelectorProps) {
  const { editor } = useEditor()
  const [inputValue, setInputValue] = useState("")

  const { completion, completionMsg, chat, isLoading } = useChat({
    // id: @refly-packages/editor-core,
    onResponse: response => {
      if (response.status === 429) {
        toast.error("You have reached your request limit for the day.")
        return
      }
    },
    onError: e => {
      toast.error(e.message)
    },
  })

  const hasCompletion = completion.length > 0

  return (
    <Command className="w-[350px]">
      {hasCompletion && (
        <div className="flex max-h-[400px]">
          <ScrollArea>
            <div className="p-2 px-4 prose-sm prose">
              <Markdown>{completion}</Markdown>
            </div>
          </ScrollArea>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center w-full h-12 px-4 text-sm font-medium text-purple-500 text-muted-foreground">
          <Magic className="w-4 h-4 mr-2 shrink-0" />
          AI is thinking
          <div className="mt-1 ml-2">
            <CrazySpinner />
          </div>
        </div>
      )}
      {!isLoading && (
        <>
          <div className="relative">
            <CommandInput
              value={inputValue}
              onValueChange={setInputValue}
              autoFocus
              placeholder={
                hasCompletion
                  ? "Tell AI what to do next"
                  : "Ask AI to edit or generate..."
              }
              onFocus={() => {
                // addAIHighlight(editor)
              }}
            />
            <Button
              size="icon"
              className="absolute w-6 h-6 -translate-y-1/2 bg-purple-500 rounded-full right-2 top-1/2 hover:bg-purple-900"
              onClick={() => {
                const slice = editor.state.selection.content()
                const text = editor.storage.markdown.serializer.serialize(
                  slice.content,
                )

                chat({
                  userPrompt: inputValue,
                  context: {
                    type: "text",
                    content: text,
                  },
                  config: {
                    locale: "en" as LOCALE,
                  },
                }).then(() => setInputValue(""))
              }}>
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
          {hasCompletion ? (
            <AICompletionCommands
              onDiscard={() => {
                editor.chain().unsetHighlight().focus().run()
                onOpenChange(false)
                editorEmitter.emit("activeAskAI", false)
              }}
              onOpenChange={onOpenChange}
              completion={completion}
            />
          ) : (
            <AISelectorCommands
              onSelect={(value, option) =>
                chat({
                  userPrompt: option,
                  context: {
                    type: "text",
                    content: value,
                  },
                  config: {
                    locale: "en" as LOCALE,
                  },
                })
              }
            />
          )}
        </>
      )}
    </Command>
  )
}
