import { BubbleMenu, isNodeSelection, useCurrentEditor } from "@tiptap/react"
import { useMemo, useRef, useEffect, forwardRef } from "react"
import type { BubbleMenuProps } from "@tiptap/react"
import type { ReactNode } from "react"
import type { Instance, Props } from "tippy.js"

export interface EditorBubbleProps extends Omit<BubbleMenuProps, "editor"> {
  readonly children: ReactNode
  askAIShow?: boolean
}

export const EditorBubble = forwardRef<HTMLDivElement, EditorBubbleProps>(
  ({ children, tippyOptions, ...rest }, ref) => {
    const { editor: currentEditor } = useCurrentEditor()
    const instanceRef = useRef<Instance<Props> | null>(null)
    const askAIShowRef = useRef<boolean>(rest?.askAIShow ?? false)

    useEffect(() => {
      if (!instanceRef.current || !tippyOptions?.placement) return

      instanceRef.current.setProps({ placement: tippyOptions.placement })
      instanceRef.current.popperInstance?.update()
    }, [tippyOptions?.placement])
    useEffect(() => {
      askAIShowRef.current = rest?.askAIShow ?? false
    }, [rest?.askAIShow])

    const bubbleMenuProps: Omit<BubbleMenuProps, "children"> = useMemo(() => {
      const shouldShow: BubbleMenuProps["shouldShow"] = ({ editor, state }) => {
        const { selection } = state
        const { empty } = selection

        console.log(
          "shouldshow",
          !editor.isEditable,
          editor.isActive("image"),
          empty,
          isNodeSelection(selection),
          askAIShowRef.current,
        )

        // don't show bubble menu if:
        // - the editor is not editable
        // - the selected node is an image
        // - the selection is empty
        // - the selection is a node selection (for drag handles)
        if (
          (!editor.isEditable ||
            editor.isActive("image") ||
            empty ||
            isNodeSelection(selection)) &&
          !askAIShowRef.current
        ) {
          return false
        }
        return true
      }

      return {
        shouldShow,
        tippyOptions: {
          onCreate: val => {
            instanceRef.current = val
          },
          moveTransition: "transform 0.15s ease-out",
          ...tippyOptions,
        },
        ...rest,
      }
    }, [rest, rest.askAIShow, tippyOptions])

    if (!currentEditor) return null

    return (
      // We need to add this because of https://github.com/ueberdosis/tiptap/issues/2658
      <div ref={ref}>
        <BubbleMenu editor={currentEditor} {...bubbleMenuProps}>
          {children}
        </BubbleMenu>
      </div>
    )
  },
)

EditorBubble.displayName = "EditorBubble"

export default EditorBubble
