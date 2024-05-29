import { storage } from "wxt/storage";
import { safeParseJSON } from "@/utils/parse";
import { Runtime } from "wxt/browser";

export const onExternalMessage = async (
  msg: any,
  sender: Runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
  console.log("onMessageExternal msg", msg);
  if (msg?.name === "refly-login-notify") {
    const loginNotifyStr = await storage.getItem("sync:login-notify");
    const userProfile = safeParseJSON(loginNotifyStr);

    if (!userProfile) {
      // 回复消息，关闭弹窗
      browser.tabs.sendMessage(sender?.tab?.id!, {
        name: "refly-login-notify",
      });

      const lastTabId = (await storage.getItem("sync:lastTabId")) as string;
      const lastWindowId = (await storage.getItem(
        "sync:lastWindowId"
      )) as string;
      console.log("lastTabId", lastTabId, lastWindowId);
      if (lastTabId && lastWindowId) {
        await browser.windows.update(parseInt(lastWindowId), {
          focused: true,
        });
        await browser.tabs.update(parseInt(lastTabId || ""), {
          active: true,
        });
      }

      await storage.setItem("sync:refly-login-notify", JSON.stringify(msg));
    }
  }

  if (msg?.name === "logout-notify") {
    await storage.removeItem("sync:refly-login-notify");
    browser.tabs.sendMessage(sender?.tab?.id!, {
      name: "refly-logout-notify",
    });
  }
};
