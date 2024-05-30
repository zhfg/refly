import { Runtime } from "wxt/browser";
import { getCurrentTab } from "./tabs";

// TODO: return types support
export const sendToBackground = async (message: {
  name: string;
  body?: any;
  type?: "request";
}) => {
  await browser.runtime.sendMessage(message);

  const waitForResponse = new Promise((resolve) => {
    const listener = (response: any) => {
      if (response?.data?.name === message?.name) {
        browser.runtime.onMessage.removeListener(listener);

        resolve(response);
      }
    };

    browser.runtime.onMessage.addListener(listener);
  });

  const res = await waitForResponse;
  return res as Promise<{ success: boolean; data: any; errMsg?: string }>;
};

// sendToContentScript 和 useExtensionMessage 配合使用
export const sendToContentScript = async (message: {
  name: string;
  body?: any;
}) => {
  const currentTab = await getCurrentTab();
  if (!currentTab?.id) return;

  await browser.tabs.sendMessage(currentTab?.id as number, message);
};
