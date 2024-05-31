import { useBuildThreadAndRun } from "@refly/ai-workspace-common/hooks/use-build-thread-and-run"
import { useCopilotContextState } from "@refly/ai-workspace-common/hooks/use-copilot-context-state"
import { useKnowledgeBaseStore } from "@refly/ai-workspace-common/stores/knowledge-base"
import {
  SearchTarget,
  useSearchStateStore,
} from "@refly/ai-workspace-common/stores/search-state"
import { getQuickActionPrompt } from "@refly/ai-workspace-common/utils/quickActionPrompt"
import { Button, Tag } from "@arco-design/web-react"
import {
  IconCloseCircle,
  IconFile,
  IconFolder,
  IconFontColors,
} from "@arco-design/web-react/icon"

export const ContextStateDisplay = () => {
  const {
    showKnowledgeBaseContext,
    showResourceContext,
    currentKnowledgeBase,
    currentResource,
    currentSelectedText,
    showSelectedTextContext,
  } = useCopilotContextState()
  const searchStateStore = useSearchStateStore()
  const knowledgeBaseStore = useKnowledgeBaseStore()
  const { runTask } = useBuildThreadAndRun()

  return (
    <div className="ai-copilot-context-state-display-container">
      {showSelectedTextContext ? (
        <div className="context-state-card context-state-current-page">
          <div className="context-state-card-header">
            <div className="context-state-card-header-left">
              <IconFontColors />
              <span className="context-state-card-header-title">
                指定内容问答
              </span>
            </div>
            <div className="context-state-card-header-right">
              <IconCloseCircle
                onClick={() => {
                  knowledgeBaseStore.updateSelectedText("")
                  searchStateStore.setSearchTarget(SearchTarget.CurrentPage)
                }}
              />
            </div>
          </div>
          <div className="context-state-card-body">
            <div className="context-state-resource-item">
              <Tag
                icon={<IconFontColors />}
                bordered
                className="context-state-resource-item-tag">
                {currentSelectedText}
              </Tag>
            </div>
            <div className="context-state-action-list">
              <div className="context-state-action-item">
                <Button
                  type="primary"
                  size="mini"
                  style={{ borderRadius: 8 }}
                  onClick={() => {
                    runTask(getQuickActionPrompt("explain")?.prompt)
                  }}>
                  解释说明
                </Button>
              </div>
              <div className="context-state-action-item">
                <Button
                  type="primary"
                  size="mini"
                  style={{ borderRadius: 8 }}
                  onClick={() => {
                    runTask(getQuickActionPrompt("translate")?.prompt)
                  }}>
                  翻译
                </Button>
              </div>
            </div>
          </div>
          <div className="context-state-card-footer"></div>
        </div>
      ) : null}
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
                  searchStateStore.setSearchTarget(SearchTarget.All)
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
                  searchStateStore.setSearchTarget(SearchTarget.All)
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
