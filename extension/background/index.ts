import { bgStorage } from "~storage/index"
import { safeParseJSON } from "~utils/parse"

// 接收 refly 官网的消息，了解登录的状态
chrome.runtime.onMessageExternal.addListener(
  async (msg: any, sender, sendResponse) => {
    console.log("onMessageExternal msg", msg)
    if (msg?.name === "refly-login-notify") {
      const userProfile = safeParseJSON(await bgStorage.get("login-notify"))

      if (!userProfile) {
        // 回复消息，关闭弹窗
        chrome.tabs.sendMessage(sender?.tab?.id, {
          name: "refly-login-notify",
        })

        const lastTabId = await bgStorage.get("lastTabId")
        const lastWindowId = await bgStorage.get("lastWindowId")
        console.log("lastTabId", lastTabId, lastWindowId)
        if (lastTabId && lastWindowId) {
          await chrome.windows.update(parseInt(lastWindowId), { focused: true })
          await chrome.tabs.update(parseInt(lastTabId || ""), { active: true })
        }

        await bgStorage.set("refly-login-notify", JSON.stringify(msg))
      }
    }

    if (msg?.name === "logout-notify") {
      await bgStorage.remove("refly-login-notify")
      chrome.tabs.sendMessage(sender?.tab?.id, {
        name: "refly-logout-notify",
      })
    }
  },
)

chrome.tabs.onActivated.addListener(function (activeInfo) {
  // 在此处处理标签切换
  console.log(
    "Tab with ID " +
      activeInfo.tabId +
      " was activated in window " +
      activeInfo.windowId,
  )

  // 给 tab 发消息，进行 userProfile 检查，包括更新 i18n 和登录状态
  chrome.tabs.sendMessage(activeInfo.tabId, {
    name: "refly-status-check",
  })
})
