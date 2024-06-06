import { BackgroundMessage } from '@refly/ai-workspace-common/requests/proxiedRequest';
import { getCurrentTab, getLastActiveTab } from './tabs';

export const sendToBackground = async (message: { type?: string; name: string; body?: any }) => {
  await browser.runtime.sendMessage(message);

  const waitForResponse = new Promise((resolve) => {
    const listener = (response: any) => {
      if (response?.name === message?.name) {
        browser.runtime.onMessage.removeListener(listener);

        resolve(response?.body);
      }
    };

    browser.runtime.onMessage.addListener(listener);
  });

  const res = await waitForResponse;
  return res as Promise<{ success: boolean; data: any; errMsg?: string }>;
};

export const sendToBackgroundV2 = async (message: BackgroundMessage) => {
  await browser.runtime.sendMessage(message);

  const waitForResponse = new Promise((resolve) => {
    const listener = (response: any) => {
      if (response?.name === message?.name) {
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
export const sendToContentScript = async (message: { name: string; body?: any }) => {
  // 先使用 senderTab，然后 backUp 到 currentTab
  let lastActiveTab = await getLastActiveTab();
  if (!lastActiveTab?.id) {
    lastActiveTab = await getCurrentTab();
  }

  if (!lastActiveTab?.id) return;

  await browser.tabs.sendMessage(lastActiveTab?.id as number, message);
};
