import { useEffect } from "react"

export const useProcessLoginNotify = () => {
  // 收到消息之后，关闭窗口
  const handleExtensionMessage = (request: any) => {
    console.log("activate useProcessLoginNotify", request)
    if (request?.data?.name === "refly-login-notify") {
      window.close()
    }
  }

  useEffect(() => {
    chrome.runtime.onMessage.addListener(handleExtensionMessage)

    return () => {
      chrome.runtime.onMessage.removeListener(handleExtensionMessage)
    }
  }, [])
}
