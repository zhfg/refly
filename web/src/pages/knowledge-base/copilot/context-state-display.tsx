import { useCopilotContextState } from "@/hooks/use-copilot-context-state"
import { SearchTarget, useSearchStateStore } from "@/stores/search-state"
import { Tag } from "@arco-design/web-react"
import {
  IconCloseCircle,
  IconFile,
  IconFolder,
} from "@arco-design/web-react/icon"

export const ContextStateDisplay = () => {
  const {
    showKnowledgeBaseContext,
    showResourceContext,
    currentKnowledgeBase,
    currentResource,
  } = useCopilotContextState()
  const searchStateStore = useSearchStateStore()

  const clearContextState = () => {
    searchStateStore.setSearchTarget(SearchTarget.None)
  }

  return (
    <div className="ai-copilot-context-state-display-container">
      {showResourceContext ? (
        <div className="context-state-card context-state-current-page">
          <div className="context-state-card-header">
            <div className="context-state-card-header-left">
              <IconFile />
              <span className="context-state-card-header-title">
                选中当前页面问答
              </span>
            </div>
            <div className="context-state-card-header-right">
              <IconCloseCircle
                onClick={() => {
                  clearContextState()
                }}
              />
            </div>
          </div>
          <div className="context-state-card-body">
            <div className="context-state-resource-item">
              <Tag
                icon={<IconFile />}
                bordered
                className="context-state-resource-item-tag">
                {currentResource?.title}
              </Tag>
            </div>
          </div>
          <div className="context-state-card-footer"></div>
        </div>
      ) : null}
      {showKnowledgeBaseContext ? (
        <div className="context-state-card context-state-current-knowledge-base">
          <div className="context-state-card-header">
            <div className="context-state-card-header-left">
              <IconFolder />
              <span className="context-state-card-header-title">
                选中当前知识库问答
              </span>
            </div>
            <div className="context-state-card-header-right">
              <IconCloseCircle
                onClick={() => {
                  clearContextState()
                }}
              />
            </div>
          </div>
          <div className="context-state-card-body">
            <div className="context-state-resource-item">
              <Tag
                icon={<IconFile />}
                bordered
                className="context-state-resource-item-tag">
                {currentKnowledgeBase?.title}
              </Tag>
            </div>
          </div>
          <div className="context-state-card-footer"></div>
        </div>
      ) : null}
    </div>
  )
}
