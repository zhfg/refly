import * as requestModule from '@refly/openapi-schema';
import { getRuntime } from '../utils/env';

export interface BackgroundMessage {
  name: string;
  type: 'apiRequest' | 'others';
  target: any;
  thisArg: any;
  args: any;
}

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
  return res;
};

const proxiedRequestModule = new Proxy(requestModule, {
  get(target, propKey, receiver) {
    const origMethod = target[propKey as keyof typeof requestModule];

    if (getRuntime() === 'extension' && typeof origMethod === 'function') {
      // The return function type is unknown because we don't know the exact signature of each function
      return async function (thisArg: unknown, ...args: unknown[]) {
        console.log(`Calling function ${String(propKey)} with arguments: ${args}`);

        try {
          const res = await sendToBackgroundV2({
            name: String(propKey),
            type: 'apiRequest',
            target,
            thisArg,
            args,
          });

          return res;
        } catch (err) {
          return {
            success: false,
            errMsg: err,
          };
        }
      };
    }

    // If it's not a function, return the property as is
    return origMethod;
  },
});

export default proxiedRequestModule;
