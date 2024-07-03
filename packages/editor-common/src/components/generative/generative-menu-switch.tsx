import { EditorBubble, useEditor } from "@refly-packages/editor-core/components"
import { removeAIHighlight } from "@refly-packages/editor-core/extensions"
import {} from "@refly-packages/editor-core/plugins"
import { Fragment, type ReactNode, useEffect, useState } from "react"
import { Button } from "../ui/button"
import Magic from "../ui/icons/magic"
import { AISelector } from "@refly-packages/editor-component/generative/ai-selector"
import { editorEmitter } from "@refly-packages/editor-core/utils/event"

interface GenerativeMenuSwitchProps {
  children: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
}
const GenerativeMenuSwitch = ({
  children,
  open,
  onOpenChange,
}: GenerativeMenuSwitchProps) => {
  const { editor } = useEditor()

  useEffect(() => {
    if (!open) removeAIHighlight(editor)
  }, [open])

  return (
    <EditorBubble
      tippyOptions={{
        placement: open ? "bottom-start" : "top",
        onHidden: () => {
          onOpenChange(false)
          editor.chain().unsetHighlight().run()
        },
      }}
      className="z-50 flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl">
      {open && <AISelector open={open} onOpenChange={onOpenChange} />}
      {!open && (
        <Fragment>
          <Button
            className="gap-1 text-purple-500 rounded-none"
            variant="ghost"
            onClick={() => onOpenChange(true)}
            size="sm">
            <Magic className="w-5 h-5" />
            Ask AI
          </Button>
          {children}
        </Fragment>
      )}
    </EditorBubble>
  )
}

export default GenerativeMenuSwitch
