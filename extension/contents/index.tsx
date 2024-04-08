import ArcoCSS from "data-text:@arco-design/web-react/dist/css/arco.css"
import TailwindCSS from "data-text:~/contents/tailwind.css"
import LocalArcoCSS from "data-text:~/contents/arco.css"
import CSSText from "data-text:~/contents/index.scss"
import HighlightCSSText from "data-text:~/contents/styles/highlight.scss"
import MarkdownCSSText from "data-text:~/contents/styles/markdown.scss"
import ThreadLibraryCSSText from "data-text:~/components/thread-library/index.scss"
import ThreadItemCSSText from "data-text:~/components/thread-item/thread-item.scss"
import HomeCSSText from "data-text:~/components/home/index.scss"
import WeblinkCSSText from "data-text:~/components/weblink-list/index.scss"
import LoginCSSText from "data-text:~/components/login/index.scss"
import EmptyThreadLibraryCSSText from "data-text:~/components/empty-thread-library-status/index.scss"
import type { PlasmoGetInlineAnchor } from "plasmo"
import React, { useEffect } from "react"
import { MemoryRouter } from "react-router-dom"

// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
// import { dark } from "react-syntax-highlighter/dist/esm/styles/prism"

import Logo from "~assets/logo.svg"
// 使用方法
import { useSwitchTheme } from "~hooks/use-switch-theme"

// hooks
import { useProcessLoginNotify } from "~hooks/use-process-login-notify"
// import { useRegisterMouseEvent } from "../hooks/use-register-mouse-event"
import { useExtensionMessage } from "../hooks/use-extension-message"
import { useBindCommands } from "../hooks/use-bind-commands"
import { useSetContainerDimension } from "../hooks/use-set-container-dimension"
// stores
import { useSiderStore } from "~stores/sider"
import { useQuickActionStore } from "~stores/quick-action"

// 组件
import { Message } from "@arco-design/web-react"
import { ContentRouter } from "../components/router"
import { Markdown } from "~components/markdown"

// export const config: PlasmoCSConfig = {
//   run_at: "document_end"
// }

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => document.body

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent =
    TailwindCSS +
    LocalArcoCSS +
    ArcoCSS +
    CSSText +
    HomeCSSText +
    ThreadLibraryCSSText +
    ThreadItemCSSText +
    WeblinkCSSText +
    MarkdownCSSText +
    HighlightCSSText +
    LoginCSSText +
    EmptyThreadLibraryCSSText
  return style
}

export const Content = () => {
  // 打开聊天窗口的方式
  const siderStore = useSiderStore()
  const quickActionStore = useQuickActionStore()

  // 注册 mouse event
  // useRegisterMouseEvent()
  // 监听打开与关闭侧边栏消息
  useExtensionMessage()
  // 绑定快捷键，后续允许用户自定义快捷键
  useBindCommands()
  // 设定主题样式
  useSwitchTheme()
  // 在激活侧边栏时，设置可操作的空间 Dimension，可以使得组件库效果展示好
  useSetContainerDimension()
  // 处理登录状态
  useProcessLoginNotify()

  // 设置 Message 通知的 container
  useEffect(() => {
    Message.config({
      getContainer: () =>
        document
          .querySelector("plasmo-csui")
          ?.shadowRoot?.querySelector(".main"),
    })
  }, [])

  return (
    <div className="light app-container">
      <div
        className={quickActionStore.selectedText ? "entry active" : "entry"}
        onClick={(_) => siderStore.setShowSider(!siderStore.showSider)}>
        <img src={Logo} alt="唤起 Refly" style={{ width: 25, height: 25 }} />
        <span>⌘B</span>
      </div>

      <div
        id="refly-app-main"
        className={siderStore.showSider ? "main active" : "main"}>
        <MemoryRouter>
          <ContentRouter />
        </MemoryRouter>
      </div>
    </div>
  )
}

export default Content
