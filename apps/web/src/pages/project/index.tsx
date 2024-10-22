import { useEffect } from "react"
import { Helmet } from "react-helmet"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"

import { KnowledgeBaseDetail } from "@refly-packages/ai-workspace-common/components/knowledge-base/knowledge-base-detail"
import { AICopilot } from "@refly-packages/ai-workspace-common/components/knowledge-base/copilot"
import { AINote } from "@refly-packages/ai-workspace-common/components/knowledge-base/ai-note"

import { useCookie } from "react-use"
import { useUserStoreShallow } from "@refly-packages/ai-workspace-common/stores/user"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { ErrorBoundary } from "@sentry/react"
import { useKnowledgeBaseStoreShallow } from "@refly-packages/ai-workspace-common/stores/knowledge-base"
import { useCanvasStoreShallow } from "@refly-packages/ai-workspace-common/stores/canvas"

import "./index.scss"

/**
 *
 * 分层架构设计：AI Workspace -> AI Knowledge Base (Knowledge Collecton + AI Note + AI Copilot)
 * /knowledge-base 打开的是一体的，通过 query 参数显示 collection、note 或 copilot，都属于 knowledge base 里面的资源
 */
const KnowledgeLibraryLayout = () => {
  const [token] = useCookie("_refly_ai_sid")
  const [searchParams] = useSearchParams()
  const kbId = searchParams.get("kbId")
  const resId = searchParams.get("resId")
  const noteId = searchParams.get("noteId")
  const userStore = useUserStoreShallow(state => ({
    userProfile: state.userProfile,
  }))
  const knowledgeBaseStore = useKnowledgeBaseStoreShallow(state => ({
    resourcePanelVisible: state.resourcePanelVisible,
    updateResourcePanelVisible: state.updateResourcePanelVisible,
  }))
  const canvasStore = useCanvasStoreShallow(state => ({
    canvasPanelVisible: state.canvasPanelVisible,
    updateCanvasPanelVisible: state.updateCanvasPanelVisible,
  }))
  const { t } = useTranslation()

  useEffect(() => {
    if (!(token || userStore?.userProfile?.uid)) return

    if (resId) {
      knowledgeBaseStore.updateResourcePanelVisible(true)
    }
    if (noteId) {
      canvasStore.updateCanvasPanelVisible(true)
    }
  }, [token, userStore?.userProfile?.uid, resId, noteId])

  useEffect(() => {
    if (kbId) {
      knowledgeBaseStore.updateResourcePanelVisible(true)
    }
  }, [])

  const copilotStyle =
    knowledgeBaseStore.resourcePanelVisible || canvasStore.canvasPanelVisible
      ? {
          defaultSize: 35,
          minSize: 35,
          maxSize: 50,
        }
      : {
          defaultSize: 100,
          minSize: 100,
          maxSize: 100,
        }

  return (
    <ErrorBoundary>
      <div className="workspace-container" style={{}}>
        <Helmet>
          <title>
            {t("productName")} | {t("landingPage.slogan")}
          </title>
          <meta name="description" content={t("landingPage.description")} />
        </Helmet>
        <div className="workspace-inner-container">
          <PanelGroup
            direction="horizontal"
            className="workspace-panel-container">
            {knowledgeBaseStore.resourcePanelVisible ? (
              <>
                <Panel
                  minSize={20}
                  order={1}
                  className="workspace-left-assist-panel"
                  key="workspace-left-assist-panel"
                  id="workspace-left-assist-panel">
                  <KnowledgeBaseDetail />
                </Panel>
                <PanelResizeHandle
                  className="workspace-panel-resize"
                  key="workspace-panel-resize"
                  id={`workspace-panel-resize-${kbId}`}
                />
              </>
            ) : null}
            {canvasStore.canvasPanelVisible ? (
              <>
                <Panel
                  minSize={35}
                  order={2}
                  className="workspace-content-panel"
                  key="workspace-content-panel"
                  id={`workspace-content-panel-note`}>
                  <AINote />
                </Panel>
                <PanelResizeHandle
                  className="workspace-panel-resize"
                  key="workspace-panel-resize"
                  id={`workspace-panel-resize-${noteId}`}
                />
              </>
            ) : null}
            <Panel
              order={3}
              className="workspace-content-panel"
              {...copilotStyle}
              key="workspace-content-panel"
              id="workspace-content-panel-copilot">
              <AICopilot />
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default KnowledgeLibraryLayout
