import { useKnowledgeBaseStore } from "@/stores/knowledge-base"
import { SearchTarget, useSearchStateStore } from "@/stores/search-state"
import { useEffect, useRef } from "react"

export const useListenToSelection = (selector: string) => {
  const mouseUpTimerRef = useRef<number>()
  const mouseDownTimerRef = useRef<number>()
  const knowledgeBaseStore = useKnowledgeBaseStore()
  const searchStateStore = useSearchStateStore()

  const timerForMouseEvent = () => {
    const selection = window.getSelection()
    const text = selection?.toString()

    if (text && text?.trim()?.length > 0) {
      knowledgeBaseStore.updateSelectedText(text)
      searchStateStore.setSearchTarget(SearchTarget.CurrentPage)
    } else {
      knowledgeBaseStore.updateSelectedText("")
    }
  }

  const handleMouseUp = () => {
    mouseUpTimerRef.current = window.setTimeout(timerForMouseEvent)
  }

  const handleMouseDown = () => {
    mouseDownTimerRef.current = window.setTimeout(timerForMouseEvent)
  }

  const handleListenToSelection = () => {
    const divElement = document.querySelector(`.${selector}`) as HTMLElement

    divElement.addEventListener("mousedown", handleMouseDown)
    divElement.addEventListener("mouseup", handleMouseUp)
  }

  useEffect(() => {
    handleListenToSelection()

    return () => {
      const divElement = document.querySelector(`.${selector}`) as HTMLElement
      divElement?.removeEventListener("mousedown", handleMouseDown)
      divElement?.removeEventListener("mouseup", handleMouseUp)
      clearTimeout(mouseDownTimerRef.current)
      clearTimeout(mouseUpTimerRef.current)
    }
  }, [])
}
