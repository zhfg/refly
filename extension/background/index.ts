import { sendToContentScript } from "@plasmohq/messaging"
import { bgStorage } from "~storage/index"

// 接收 refly 官网的消息，了解登录的状态
chrome.runtime.onMessageExternal.addListener(
  async (msg: any, sender, sendResponse) => {
    console.log("onMessageExternal msg", msg)
    if (msg?.name === "login-notification") {
      const lastTabId = await bgStorage.get("lastTabId")
      const lastWindowId = await bgStorage.get("lastWindowId")
      console.log("lastTabId", lastTabId, lastWindowId)

      if (lastTabId && lastWindowId) {
        await chrome.windows.update(parseInt(lastWindowId), { focused: true })
        await chrome.tabs.update(parseInt(lastTabId || ""), { active: true })
      }

      await chrome.tabs.sendMessage(parseInt(lastTabId), {
        name: "login-notification",
        body: msg,
      })

      await bgStorage.set("login-notification", JSON.stringify(msg))
      // sendToContentScript({

      // })
    }
  },
)
