import { Runtime } from "wxt/browser";
import { getCurrentTab } from "./tabs";

// TODO: return types support
export const sendToBackground = async (message: {
  name: string;
  body?: any;
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

export const sendToContentScript = async (message: {
  name: string;
  body?: any;
}) => {
  const currentTab = await getCurrentTab();
  if (!currentTab?.id) return;

  await browser.tabs.sendMessage(currentTab?.id as number, message);
};

let portStore: { [key: string]: Runtime.Port } = {};
export const getPort = (name: string) => {
  if (portStore?.[name]) return;

  const port = browser.runtime.connect({
    name,
  });
  portStore[name] = port;

  return port;
};

export const removePort = (name: string) => {
  const port = portStore?.[name];

  if (port) {
    port.disconnect();
  }
};
