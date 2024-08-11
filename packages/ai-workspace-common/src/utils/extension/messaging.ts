import { IRuntime, setRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { getLastActiveTab } from '@refly-packages/ai-workspace-common/utils/extension/tabs';

export type BackgroundMsgType =
  | 'apiRequest'
  | 'others'
  | 'registerEvent'
  | 'operateTabStorage'
  | 'injectContentSelectorCss';

export interface BackgroundMessage<T = any> {
  name: string;
  body?: T;
  type?: BackgroundMsgType;
  source: IRuntime;
  target?: any;
  args?: any;
}

export const sendToBackground = async (message: BackgroundMessage, needResponse = true) => {
  try {
    const { browser } = await import('wxt/browser');
    const waitForResponse = new Promise((resolve) => {
      const listener = (response: any) => {
        // console.log('sendToBackground response', response);
        if (response?.name === message?.name) {
          browser.runtime.onMessage.removeListener(listener);

          resolve(response?.body);
        }
      };

      browser.runtime.onMessage.addListener(listener);
    });
    await browser.runtime.sendMessage(message);

    if (needResponse) {
      const res = await waitForResponse;
      return res;
    }
  } catch (err) {
    // console.log('sendToBackground error', err);
  }
};

export const sendToSidePanel = sendToBackground;

// from sidePanel/background/content script to webpage/content script
export const sendToWebpageMainWorld = async (
  message: BackgroundMessage,
  fromRuntime: IRuntime,
  needResponse = true,
) => {
  try {
    const { browser } = await import('wxt/browser');
    const waitForResponse = new Promise((resolve) => {
      const listener = (response: any) => {
        // console.log('sendToBackground response', response);
        if (response?.name === message?.name) {
          browser.runtime.onMessage.removeListener(listener);

          resolve(response?.body);
        }
      };

      browser.runtime.onMessage.addListener(listener);
    });

    if (['extension-sidepanel', 'extension-background'].includes(fromRuntime)) {
      const tabs = await browser.tabs.query({ active: true });
      const activeTabId = tabs?.[0]?.id;
      if (activeTabId) {
        await browser.tabs.sendMessage(activeTabId, message);
      }
    } else if (fromRuntime === 'extension-csui') {
      window.postMessage(message, '*');
    }

    if (needResponse) {
      const res = await waitForResponse;
      return res;
    }
  } catch (err) {
    console.log('sendToWebpageMainWorld error', err);
  }
};

// from webpage/background/side panel/content script to content script
export const sendToContentScript = sendToWebpageMainWorld;

// 同时处理各种情况，support web pages，兼容 web 中 copilot 与内容的交互
export const sendMessage = async (message: BackgroundMessage, needResponse = true) => {
  const fromRuntime = message?.source;
  let browser;
  try {
    if (fromRuntime !== 'web') {
      const { browser: _browser } = await import('wxt/browser');
      browser = _browser;
    }

    const waitForResponse = new Promise((resolve) => {
      const listener = (response: any) => {
        // console.log('sendToBackground response', response);
        if (response?.name === message?.name) {
          if (browser?.runtime?.onMessage) {
            browser.runtime.onMessage.removeListener(listener);
          }

          if (window?.addEventListener) {
            window.removeEventListener('message', listener);
          }

          resolve(response?.currentTarget ? response?.data?.body : response?.body);
        }
      };

      if (browser?.runtime?.onMessage) {
        browser.runtime.onMessage.addListener(listener);
      }

      if (window?.addEventListener) {
        window.addEventListener('message', listener);
      }
    });

    if (['extension-sidepanel', 'extension-background'].includes(fromRuntime)) {
      const tabs = await browser.tabs.query({ active: true });
      const activeTabId = tabs?.[0]?.id;
      if (activeTabId) {
        await browser.tabs.sendMessage(activeTabId, message);
      }

      // 这里兼容 sidepanel 给 background 发消息
      if (browser?.runtime?.sendMessage) {
        await browser.runtime.sendMessage(message);
      }
    } else if (fromRuntime === 'extension-csui') {
      if (window?.postMessage) {
        window.postMessage(message, '*');
      }

      if (browser?.runtime?.sendMessage) {
        await browser.runtime.sendMessage(message);
      }
    } else if (fromRuntime === 'web') {
      if (window?.postMessage) {
        window.postMessage(message, '*');
      }
    }

    if (needResponse) {
      const res = await waitForResponse;
      return res;
    }
  } catch (err) {
    console.log('sendMessage error', err);
  }
};

export const onMessage = async (_callback: (message: any) => void, fromRuntime: IRuntime) => {
  let callback = _callback;
  let windowCallback = (event: MessageEvent) => {
    callback(event?.data);
  };
  let browser;
  if (fromRuntime !== 'web') {
    const { browser: _browser } = await import('wxt/browser');
    browser = _browser;
  }

  if (['extension-sidepanel', 'extension-background'].includes(fromRuntime)) {
    browser.runtime.onMessage.addListener(callback);
  } else if (fromRuntime === 'extension-csui') {
    // 1. csui -> csui 2. background/sidepanel -> csui
    if (window?.addEventListener) {
      window.addEventListener('message', windowCallback);
    }

    if (browser?.runtime?.onMessage) {
      browser.runtime.onMessage.addListener(callback);
    }
  } else if (fromRuntime === 'web') {
    if (window?.addEventListener) {
      window.addEventListener('message', windowCallback);
    }
  }

  return () => {
    if (['extension-sidepanel', 'extension-background'].includes(fromRuntime)) {
      browser.runtime.onMessage.removeListener(callback);
    } else if (fromRuntime === 'extension-csui') {
      if (window?.addEventListener) {
        window.removeEventListener('message', windowCallback);
      }

      if (browser?.runtime?.onMessage) {
        browser.runtime.onMessage.removeListener(callback);
      }
    } else if (fromRuntime === 'web') {
      if (window?.addEventListener) {
        window.removeEventListener('message', windowCallback);
      }
    }
  };
};
