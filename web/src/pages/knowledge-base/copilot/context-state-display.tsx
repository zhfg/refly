import { SearchTarget, useSearchStateStore } from "@/stores/search-state"
import { useSearchParams } from "react-router-dom"

export const ContextStateDisplay = () => {
  const searchStateStore = useSearchStateStore()

  const [queryParams] = useSearchParams()
  const resId = queryParams.get("resId")
  const kbId = queryParams.get("kbId")

  const showContextState = !!resId || !!kbId
  const isCurrentPageSelected =
    searchStateStore?.searchTarget === SearchTarget.CurrentPage
  const isCurrentKnowledgeBaseSelected =
    searchStateStore?.searchTarget === SearchTarget.CurrentKnowledgeBase

  return (
    <div className="ai-copilot-context-state-display-container">
      {showContextState && isCurrentPageSelected ? (
        <div className="context-state-current-page"></div>
      ) : null}
      {showContextState && isCurrentKnowledgeBaseSelected ? (
        <div className="context-state-current-knowledge-base"></div>
      ) : null}
    </div>
  )
}
