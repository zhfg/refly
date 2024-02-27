import ArcoCSS from "data-text:@arco-design/web-react/dist/css/arco.css"
import ChatCSSText from "data-text:~/components/chat/index.scss"
import ConversationListCSS from "data-text:~/components/conversation-list/index.scss"
import QuickActionCSS from "data-text:~/components/quick-action/index.scss"
import LocalArcoCSS from "data-text:~/contents/arco.css"
import CSSText from "data-text:~/contents/index.scss"
import HighlightCSSText from "data-text:~/contents/styles/highlight.scss"
import MarkdownCSSText from "data-text:~/contents/styles/markdown.scss"
import type { PlasmoGetInlineAnchor } from "plasmo"
import React, { useEffect, useState } from "react"
import { MemoryRouter, useNavigate } from 'react-router-dom'
import classNames from 'classnames';

// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
// import { dark } from "react-syntax-highlighter/dist/esm/styles/prism"

import Logo from "~assets/logo.svg"
// 使用方法
import { useSwitchTheme } from "~hooks/use-switch-theme"

import QuickAction from "../components/quick-action"
// hooks
import { useRegisterMouseEvent } from "../hooks/use-register-mouse-event"
import { useExtensionMessage } from '../hooks/use-extension-message';
import { useBindCommands } from '../hooks/use-bind-commands';
import { useSetContainerDimension } from '../hooks/use-set-container-dimension';
// stores
import { useSiderStore } from '~stores/sider'
import { useQuickActionStore } from '~stores/quick-action'

// 组件
import { Routing } from '~routes/index';
import { Affix, Button, Message } from "@arco-design/web-react"
import { getPopupContainer } from "~utils/ui"
import { IconSearch, IconStorage } from "@arco-design/web-react/icon"

// export const config: PlasmoCSConfig = {
//   run_at: "document_end"
// }

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => document.body

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent =
    LocalArcoCSS +
    ArcoCSS +
    CSSText +
    ConversationListCSS +
    ChatCSSText +
    QuickActionCSS +
    MarkdownCSSText +
    HighlightCSSText
  return style
}

const ContentWithRouter = () => {
  // 导航相关
  const navigate = useNavigate();

  // 处理状态
  const [activeTab, setActiveTab] = useState<'home' | 'session-library'>('home')

  return (
    <div>
      <Routing />
      <div className="footer-nav-container">
        <div className="footer-nav">
          <div className={classNames('nav-item', activeTab === 'home' && 'nav-item-active')} onClick={() => {
            navigate('/')
            setActiveTab('home')
          }}>
            <div className="nav-item-inner">
              <IconSearch style={{ fontSize: 22 }} />
              <p className="nav-item-title">主页</p>
            </div>
          </div>
          <div className={classNames('nav-item', activeTab === 'session-library' && 'nav-item-active')} onClick={() => {
            navigate('/thread')
            setActiveTab('session-library')
          }}>
            <div className="nav-item-inner">
              <IconStorage style={{ fontSize: 22 }} />
              <p className="nav-item-title">会话库</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Content = () => {
  // 打开聊天窗口的方式
  const siderStore = useSiderStore();
  const quickActionStore = useQuickActionStore();

  // 注册 mouse event
  useRegisterMouseEvent()
  // 监听打开与关闭侧边栏消息
  useExtensionMessage();
  // 绑定快捷键，后续允许用户自定义快捷键
  useBindCommands();
  // 设定主题样式
  useSwitchTheme()
  // 在激活侧边栏时，设置可操作的空间 Dimension，可以使得组件库效果展示好
  useSetContainerDimension()

  // 设置 Message 通知的 container
  useEffect(() => {
    Message.config({
      getContainer: () => document
        .querySelector("plasmo-csui")
        ?.shadowRoot?.querySelector(".main")
    })
  }, [])


  return (
    <div className="light app-container">
      {quickActionStore.toolbarVisible && (
        <QuickAction
        />
      )}

      <div
        className={quickActionStore.selectedText ? "entry active" : "entry"}
        onClick={(_) => siderStore.setShowSider(!siderStore.showSider)}>
        <img src={Logo} alt="唤起 Refly" style={{ width: 25, height: 25 }} />
        <span>⌘B</span>
      </div>

      <div className={siderStore.showSider ? "main active" : "main"}>
        <MemoryRouter>
          <ContentWithRouter />
        </MemoryRouter>
      </div>
    </div>
  )
}

export default Content
