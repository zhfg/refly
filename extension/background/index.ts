import { bgStorage } from "~storage/index"
import { safeParseJSON } from "~utils/parse"

// 接收 refly 官网的消息，了解登录的状态
chrome.runtime.onMessageExternal.addListener(
  async (msg: any, sender, sendResponse) => {
    console.log("onMessageExternal msg", msg)
    if (msg?.name === "login-notification") {
      const userProfile = safeParseJSON(
        await bgStorage.get("login-notification"),
      )

      if (!userProfile) {
        // 回复消息，关闭弹窗
        chrome.tabs.sendMessage(sender?.tab?.id, {
          name: "refly-login-response",
        })

        const lastTabId = await bgStorage.get("lastTabId")
        const lastWindowId = await bgStorage.get("lastWindowId")
        console.log("lastTabId", lastTabId, lastWindowId)
        if (lastTabId && lastWindowId) {
          await chrome.windows.update(parseInt(lastWindowId), { focused: true })
          await chrome.tabs.update(parseInt(lastTabId || ""), { active: true })
        }

        await bgStorage.set("login-notification", JSON.stringify(msg))
      }
    }

    if (msg?.name === "logout-notification") {
      await bgStorage.remove("login-notification")
    }
  },
)
