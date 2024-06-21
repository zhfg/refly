import { EditorBubble, useEditor } from "@refly-packages/editor-core/components"
import { removeAIHighlight } from "@refly-packages/editor-core/extensions"
import {} from "@refly-packages/editor-core/plugins"
import { Fragment, type ReactNode, useEffect, useState } from "react"
import { Button } from "../ui/button"
import Magic from "../ui/icons/magic"
import { AISelector } from "@refly-packages/editor-component/generative/ai-selector"
import { editorEmitter } from "@refly-packages/editor-core/utils/event"

interface GenerativeMenuSwitchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}
const GenerativeMenuSwitch = ({
  open,
  onOpenChange,
}: GenerativeMenuSwitchProps) => {
  const { editor } = useEditor()
  const [askAIShow, setAskAIShow] = useState(false)

  useEffect(() => {
    if (!open) removeAIHighlight(editor)
  }, [open])

  useEffect(() => {
    editorEmitter.on("activeAskAI", (value: boolean) => {
      onOpenChange(value)
      setAskAIShow(value)
    })
    return () => {
      editorEmitter.off("activeAskAI")
    }
  }, [])

  return (
    <EditorBubble
      tippyOptions={{
        placement: open ? "bottom-start" : "top",
        onHidden: () => {
          onOpenChange(false)
          editor.chain().unsetHighlight().run()
        },
      }}
      askAIShow={askAIShow}
      className="z-50 flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl">
      {open && askAIShow && (
        <AISelector open={open} onOpenChange={onOpenChange} />
      )}
    </EditorBubble>
  )
}

export default GenerativeMenuSwitch
