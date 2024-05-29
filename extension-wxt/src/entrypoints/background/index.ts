import { storage } from "wxt/storage";
import { safeParseJSON } from "@/utils/parse";

// 接收 refly 官网的消息，了解登录的状态
chrome.runtime.onMessageExternal.addListener(
  async (msg: any, sender, sendResponse) => {
    console.log("onMessageExternal msg", msg);
    if (msg?.name === "refly-login-notify") {
      const loginNotifyStr = await storage.getItem("sync:login-notify");
      const userProfile = safeParseJSON(loginNotifyStr);

      if (!userProfile) {
        // 回复消息，关闭弹窗
        chrome.tabs.sendMessage(sender?.tab?.id!, {
          name: "refly-login-notify",
        });

        const lastTabId = (await storage.getItem("sync:lastTabId")) as string;
        const lastWindowId = (await storage.getItem(
          "sync:lastWindowId"
        )) as string;
        console.log("lastTabId", lastTabId, lastWindowId);
        if (lastTabId && lastWindowId) {
          await chrome.windows.update(parseInt(lastWindowId), {
            focused: true,
          });
          await chrome.tabs.update(parseInt(lastTabId || ""), { active: true });
        }

        await storage.setItem("sync:refly-login-notify", JSON.stringify(msg));
      }
    }

    if (msg?.name === "logout-notify") {
      await storage.removeItem("sync:refly-login-notify");
      chrome.tabs.sendMessage(sender?.tab?.id!, {
        name: "refly-logout-notify",
      });
    }
  }
);

chrome.tabs.onActivated.addListener(function (activeInfo) {
  // 在此处处理标签切换
  console.log(
    "Tab with ID " +
      activeInfo.tabId +
      " was activated in window " +
      activeInfo.windowId
  );

  // 给 tab 发消息，进行 userProfile 检查，包括更新 i18n 和登录状态
  chrome.tabs.sendMessage(activeInfo.tabId, {
    name: "refly-status-check",
  });
});

if (process.env.NODE_ENV === "production") {
  console.log = () => {}; // 覆盖console.log为空函数
  console.error = () => {}; // 覆盖console.error为空函数
}
