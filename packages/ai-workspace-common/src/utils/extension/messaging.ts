import { IRuntime } from '@refly-packages/ai-workspace-common/utils/env';

export type BackgroundMsgType = 'apiRequest' | 'others' | 'registerEvent' | 'operateTabStorage';

export interface BackgroundMessage {
  name: string;
  body?: any;
  type: BackgroundMsgType;
  source: IRuntime;
  target?: any;
  args?: any;
}

export const sendToBackground = async (message: BackgroundMessage, needResponse = true) => {
  try {
    const { browser } = await import('wxt/browser');
    const waitForResponse = new Promise((resolve) => {
      const listener = (response: any) => {
        console.log('sendToBackground response', response);
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
    console.log('sendToBackground error', err);
  }
};
