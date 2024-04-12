import { Button, Spin } from "@arco-design/web-react"
import { useEffect, useRef, useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import { reflyEnv } from "~utils/env"

import "@arco-design/web-react/dist/css/arco.css"
import "./popup.scss"

import { IconRefresh } from "@arco-design/web-react/icon"

import Logo from "~assets/logo.svg"

const getActiveTab = async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  })
  return tab
}

const checkPageUnsupported = (pageUrl: string) => {
  console.log("checking page url", JSON.stringify(pageUrl))

  if (pageUrl) {
    const checkBrowserSettingPage =
      pageUrl.startsWith("chrome://") ||
      pageUrl.startsWith("edge://") ||
      pageUrl.startsWith("about:")
    const checkBrowserExtensionStorePage = [
      "https://chrome.google.com/webstore",
      "https://microsoftedge.microsoft.com/addons",
      "https://addons.mozilla.org/en-US/firefox",
    ].some((url) => pageUrl.startsWith(url))

    return checkBrowserSettingPage || checkBrowserExtensionStorePage
  }

  return true
}

/**
 * 打开 popup 页面的规则
 * 1. 如果是
 */
const Popup = () => {
  const osType = reflyEnv.getOsType()

  const [isSideBarOpen, setIsSideBarOpen] = useStorage<boolean>(
    "isSideBarOpen",
    false,
  )
  const [currentTabUrl, setCurrentTabUrl] = useState("")
  const currentTabUrlRef = useRef("")
  const [loading, setLoading] = useState(true)
  const [pageUnsupported, setPageUnsupported] = useState(false)

  const refreshPage = async () => {
    const activeTab = await getActiveTab()

    if (activeTab?.id) {
      await chrome.tabs.reload(activeTab?.id)
      window.close()
    }
  }

  const handleRunRefly = async () => {
    const activeTab = await getActiveTab()
    setCurrentTabUrl(activeTab?.url || "")
    currentTabUrlRef.current = activeTab?.url || ""

    if (activeTab) {
      chrome.tabs.sendMessage(
        activeTab?.id,
        {
          body: { name: "runRefly", toggle: !isSideBarOpen },
        },
        (response) => {
          if (response) {
            window.close()
          }
        },
      )
      setIsSideBarOpen(!isSideBarOpen)
    }
  }

  const handleCheckPageUnsupport = () => {
    setTimeout(() => {
      setLoading(false)
      const pageUnsupported = checkPageUnsupported(currentTabUrlRef.current)
      setPageUnsupported(pageUnsupported)
    }, 100)
  }

  const handleViewCreate = async () => {
    await handleRunRefly()
    handleCheckPageUnsupport()
  }

  useEffect(() => {
    handleViewCreate()
  }, [])

  if (loading) return null

  return (
    <div className="popup-page">
      <header>
        <div className="logo">
          <img className="logo-img" src={Logo} alt="" />
          <span className="title">Refly</span>
        </div>
        <div className="guide-box">
          <Button
            type="outline"
            onClick={() => {
              chrome.tabs.create({ url: "https://refly.ai" })
            }}>
            教程
          </Button>
        </div>
      </header>
      <div>
        <p className="content-title">感谢使用 Refly！</p>
        {pageUnsupported ? (
          <>
            <p className="state">
              😵 由于浏览器安全限制，Refly 无法在以下页面工作：
            </p>
            <ul>
              <li>Chrome Web 商店页面</li>
              <li>Chrome 页面</li>
              <li>新标签页</li>
            </ul>
            <p className="page-unsupported-hint">
              您可以在另一个页面（
              <a href="https://zh.wikipedia.org/wiki/ChatGPT" target="_blank">
                例如此页面
              </a>
              ）上尝试 Refly。
            </p>
          </>
        ) : (
          <>
            <p className="state">😵 你需要刷新此页面来让 Refly 正常工作</p>
            <Button long icon={<IconRefresh />} onClick={refreshPage}>
              刷新此页面
            </Button>
          </>
        )}
        <p className="shortcut-hint">
          提示：按下
          <span className="key">
            {osType === "OSX" ? "Command+J" : "Ctrl+J"}
          </span>
          以更快地激活 Refly。键盘快捷键可以在
          <a
            onClick={() => {
              chrome.tabs.create({
                url: `chrome://extensions/shortcuts`,
              })
            }}>
            此处
          </a>
          更改。
        </p>
      </div>
    </div>
  )
}

export default Popup
