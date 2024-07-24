import { useEffect } from "react"
import { Helmet } from "react-helmet"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"

// 自定义组件
import { KnowledgeBaseDetail } from "@refly/ai-workspace-common/components/knowledge-base/knowledge-base-detail"
import { AICopilot } from "@refly/ai-workspace-common/components/knowledge-base/copilot"
import { AINote } from "@refly/ai-workspace-common/components/knowledge-base/ai-note"
// utils
// 自定义方法
// stores
// scss
import "./index.scss"
import { useCookie } from "react-use"
// types
import { useUserStore } from "@refly/ai-workspace-common/stores/user"
import { getExtensionId } from "@refly/utils/url"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { useResizePanel } from "@refly/ai-workspace-common/hooks/use-resize-panel"
import { ErrorBoundary } from "@sentry/react"
import { useKnowledgeBaseStore } from "@refly/ai-workspace-common/stores/knowledge-base"

// 用于快速选择
export const quickActionList = ["summary"]

/**
 *
 * 分层架构设计：AI Workspace -> AI Knowledge Base (Knowledge Collecton + AI Note + AI Copilot)
 * /knowledge-base 打开的是一体的，通过 query 参数显示 collection、note 或 copilot，都属于 knowledge base 里面的资源
 */
const KnowledgeLibraryLayout = () => {
  const [token] = useCookie("_refly_ai_sid")
  const [searchParams] = useSearchParams()
  const kbId = searchParams.get("kbId")
  const noteId = searchParams.get("noteId")
  const userStore = useUserStore()
  const knowledgeBaseStore = useKnowledgeBaseStore()
  const { t } = useTranslation()

  const [minSize] = useResizePanel({
    getGroupSelector: () =>
      document.querySelector(`.workspace-panel-container`) as HTMLElement,
    getResizeSelector: () =>
      document.querySelectorAll(`.workspace-panel-resize`),
    initialMinSize: 24,
    initialMinPixelSize: 310,
  })

  const handleSendMsgToExtension = async (
    status: "success" | "failed",
    token?: string,
  ) => {
    try {
      await chrome.runtime.sendMessage(getExtensionId(), {
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
  }, [token, userStore?.userProfile?.uid])

  const copilotStyle =
    (kbId && knowledgeBaseStore.resourcePanelVisible) ||
    (noteId && knowledgeBaseStore.notePanelVisible)
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
            {kbId && knowledgeBaseStore.resourcePanelVisible ? (
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
            {noteId && knowledgeBaseStore.notePanelVisible ? (
              <>
                <Panel
                  minSize={minSize}
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
              minSize={minSize}
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
