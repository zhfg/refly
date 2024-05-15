import { useEffect } from "react"
import { Helmet } from "react-helmet"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"

// 自定义组件
import { LeftAssistPanel } from "./left-assist-panel"
// utils
// 自定义方法
// stores
// scss
import "./index.scss"
import { useCookie } from "react-use"
// types
import { useUserStore } from "@/stores/user"
import { getExtensionId } from "@/utils/url"
import { useTranslation } from "react-i18next"

// 用于快速选择
export const quickActionList = ["summary"]

const Workspace = () => {
  const [token] = useCookie("_refly_ai_sid")

  const userStore = useUserStore()

  const { t } = useTranslation()

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

  // TODO: 临时关闭，用于开发调试
  console.log("token", token)
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

  return (
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
          <Panel defaultSize={20} minSize={20}>
            <LeftAssistPanel />
          </Panel>
          <PanelResizeHandle />
          <Panel minSize={70}>middle</Panel>
        </PanelGroup>
      </div>
    </div>
  )
}

export default Workspace
