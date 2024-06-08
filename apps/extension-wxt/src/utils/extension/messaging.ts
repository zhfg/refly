import { BackgroundMessage } from '@refly/ai-workspace-common/requests/proxiedRequest';
import { getCurrentTab, getLastActiveTab } from './tabs';
import { browser } from 'wxt/browser';

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
  try {
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
  } catch (err) {
    console.log('sendToBackgroundV2 error', err);
  }
};

// sendToContentScript 和 useExtensionMessage 配合使用
export const sendToContentScript = async (message: { name: string; body?: any }) => {
  try {
    // 先使用 senderTab，然后 backUp 到 currentTab
    let lastActiveTab = await getLastActiveTab();
    if (!lastActiveTab?.id) {
      lastActiveTab = await getCurrentTab();
    }

    if (!lastActiveTab?.id) return;

    await browser.tabs.sendMessage(lastActiveTab?.id as number, message);
  } catch (err) {
    console.log('sendToContentScript error', err);
  }
};
