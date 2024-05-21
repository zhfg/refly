import { useKnowledgeBaseStore } from "@/stores/knowledge-base"
import { SearchTarget, useSearchStateStore } from "@/stores/search-state"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

export const useCopilotContextState = () => {
  const [contextCardHeight, setContextCardHeight] = useState(80)
  const searchStateStore = useSearchStateStore()
  const knowledgeBaseStore = useKnowledgeBaseStore()

  const [queryParams] = useSearchParams()
  const resId = queryParams.get("resId")
  const kbId = queryParams.get("kbId")

  const showContextState = !!resId || !!kbId
  const isCurrentPageSelected =
    searchStateStore?.searchTarget === SearchTarget.CurrentPage
  const isCurrentKnowledgeBaseSelected =
    searchStateStore?.searchTarget === SearchTarget.CurrentKnowledgeBase

  const currentResource = knowledgeBaseStore.currentResource
  const currentKnowledgeBase = knowledgeBaseStore.currentKnowledgeBase

  const showResourceContext = showContextState && isCurrentPageSelected
  const showKnowledgeBaseContext =
    showContextState && isCurrentKnowledgeBaseSelected

  const showContextCard = showResourceContext || showKnowledgeBaseContext

  const calcContextCardHeight = () => {
    const elem = document.querySelector(
      ".ai-copilot-context-state-display-container",
    )
    const height = elem?.clientHeight || 0
    setContextCardHeight(height)
  }

  useEffect(() => {
    calcContextCardHeight()
  }, [showResourceContext, showKnowledgeBaseContext])

  return {
    showContextCard,
    showResourceContext,
    showKnowledgeBaseContext,
    currentResource,
    currentKnowledgeBase,
    contextCardHeight,
  }
}
