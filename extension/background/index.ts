import { sendToContentScript } from "@plasmohq/messaging"

// 接收 refly 官网的消息，了解登录的状态
chrome.runtime.onMessageExternal.addListener(
  (msg: any, sender, sendResponse) => {
    console.log("onMessageExternal msg", msg)
    if (msg?.name === "login-notification") {
      sendToContentScript({
        name: "login-notification",
        body: msg,
      })
    }
  },
)
