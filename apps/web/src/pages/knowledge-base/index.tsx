import { memo, useEffect } from "react"
import { Helmet } from "react-helmet"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"

// 自定义组件
import { KnowledgeBaseDetail } from "@refly-packages/ai-workspace-common/components/knowledge-base/knowledge-base-detail"
import { AICopilot } from "@refly-packages/ai-workspace-common/components/knowledge-base/copilot"
import { AINote } from "@refly-packages/ai-workspace-common/components/knowledge-base/ai-note"
// import { QuickAction } from "@refly-packages/ai-workspace-common/modules/quick-action/components/quick-action"
// utils
// 自定义方法
// stores
// scss
import "./index.scss"
import { useCookie } from "react-use"
// types
import { useUserStore } from "@refly-packages/ai-workspace-common/stores/user"
import { getExtensionId } from "@refly/utils/url"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { useResizePanel } from "@refly-packages/ai-workspace-common/hooks/use-resize-panel"
import { ErrorBoundary } from "@sentry/react"
import { useKnowledgeBaseStore } from "@refly-packages/ai-workspace-common/stores/knowledge-base"
import { useNoteStore } from "@refly-packages/ai-workspace-common/stores/note"

/**
 *
 * 分层架构设计：AI Workspace -> AI Knowledge Base (Knowledge Collecton + AI Note + AI Copilot)
 * /knowledge-base 打开的是一体的，通过 query 参数显示 collection、note 或 copilot，都属于 knowledge base 里面的资源
 */
const KnowledgeLibraryLayout = memo(() => {
  const [token] = useCookie("_refly_ai_sid")
  const [searchParams] = useSearchParams()
  const kbId = searchParams.get("kbId")
  const resId = searchParams.get("resId")
  const noteId = searchParams.get("noteId")
  const userStore = useUserStore(state => ({
    userProfile: state.userProfile,
  }))
  const knowledgeBaseStore = useKnowledgeBaseStore(state => ({
    resourcePanelVisible: state.resourcePanelVisible,
    updateResourcePanelVisible: state.updateResourcePanelVisible,
  }))
  const noteStore = useNoteStore(state => ({
    notePanelVisible: state.notePanelVisible,
    updateNotePanelVisible: state.updateNotePanelVisible,
  }))
  const { t } = useTranslation()

  const [minSize] = useResizePanel({
    getGroupSelector: () =>
      document.querySelector(`.workspace-panel-container`) as HTMLElement,
    getResizeSelector: () =>
      document.querySelectorAll(`.workspace-panel-resize`),
    initialMinSize: 30,
    initialMinPixelSize: 310,
  })

  const handleSendMsgToExtension = async (
    status: "success" | "failed",
    token?: string,
  ) => {
    const { browser } = await import("wxt/browser")
    try {
      await browser.runtime.sendMessage(getExtensionId(), {
        name: "refly-login-notify",
        body: {
          status,
          token,
        },
      })
    } catch (err) {
      console.log("handleSendMsgToExtension err", err)
    }

    console.log("dashboard close")
  }

  useEffect(() => {
    if (!(token || userStore?.userProfile?.uid)) return

    const reflyLoginStatus = localStorage.getItem("refly-login-status")
    console.log("reflyLoginStatus", reflyLoginStatus, token)
    if ((token || userStore?.userProfile?.uid) && reflyLoginStatus) {
      // 从插件打开弹窗，给插件发消息
      handleSendMsgToExtension("success", token as string)
      localStorage.removeItem("refly-login-status")
      // localStorage.setItem(
      //   "refly-user-profile",
      //   safeStringifyJSON(userStore?.userProfile),
      // )
      setTimeout(() => {
        window.close()
      }, 500)
    }

    if (resId) {
      knowledgeBaseStore.updateResourcePanelVisible(true)
    }
    if (noteId) {
      noteStore.updateNotePanelVisible(true)
    }
  }, [token, userStore?.userProfile?.uid, resId, noteId])

  useEffect(() => {
    if (kbId) {
      knowledgeBaseStore.updateResourcePanelVisible(true)
    }
  }, [])

  const copilotStyle =
    knowledgeBaseStore.resourcePanelVisible || noteStore.notePanelVisible
      ? {
          defaultSize: 20,
          minSize: 20,
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
            {noteStore.notePanelVisible ? (
              <>
                <Panel
                  minSize={30}
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
              minSize={30}
              key="workspace-content-panel"
              id="workspace-content-panel-copilot">
              <AICopilot />
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </ErrorBoundary>
  )
})

export default KnowledgeLibraryLayout
