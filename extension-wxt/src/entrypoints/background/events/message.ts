import { Runtime } from "wxt/browser";
import { extRequest } from "@/utils/request";
import { HandlerResponse } from "@/types/request";
import { storage } from "wxt/storage";

export const handleRequest = async (
  body: any,
  { currentTab }: { currentTab: { tabId: number; windowId: number } }
) => {
  const { url, ...extraData } = body;
  const [err, userRes] = await extRequest(url, extraData);
  let messageRes = {} as HandlerResponse<any>;

  if (err) {
    messageRes = {
      success: false,
      errMsg: err,
    };
  } else {
    messageRes = {
      success: true,
      data: userRes,
    };
  }

  await browser.tabs.sendMessage(currentTab.tabId, messageRes);
};

export const onMessage = async (
  msg: any,
  sender: Runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
  // 前置做保存，后续使用
  await storage.setItem("lastTabId", sender?.tab?.id);
  await storage.setItem("lastWindowId", sender?.tab?.windowId);

  // 处理服务端来的发请求的操作
  if (msg?.name === "request") {
    return await handleRequest(msg?.body, {
      currentTab: {
        tabId: sender?.tab?.id as number,
        windowId: sender?.tab?.windowId as number,
      },
    });
  }
};
