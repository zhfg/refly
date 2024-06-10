import { createClient, client } from '@hey-api/client-fetch';
import * as requestModule from '@refly/openapi-schema';

import { IRuntime, getRuntime } from '../utils/env';
import { getAuthTokenFromCookie } from '../utils/request';
import { getServerOrigin } from '../utils/url';

createClient({ baseUrl: getServerOrigin() + '/v1' });

client.interceptors.request.use((request) => {
  console.log('intercept request:', request);
  const token = getAuthTokenFromCookie();
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
});

export type BackgroundMsgType = 'apiRequest' | 'others' | 'registerEvent';

export interface BackgroundMessage {
  name: string;
  body?: any;
  type: BackgroundMsgType;
  source: IRuntime;
  target: any;
  args: any;
}

export const sendToBackgroundV2 = async (message: BackgroundMessage) => {
  try {
    const { browser } = await import('wxt/browser');
    const waitForResponse = new Promise((resolve) => {
      const listener = (response: any) => {
        console.log('sendToBackgroundV2', response);
        if (response?.name === message?.name) {
          browser.runtime.onMessage.removeListener(listener);

          resolve(response?.body);
        }
      };

      browser.runtime.onMessage.addListener(listener);
    });
    await browser.runtime.sendMessage(message);

    const res = await waitForResponse;
    return res;
  } catch (err) {
    console.log('sendToBackgroundV2 error', err);
  }
};

const cloneObject = (obj: any) => {
  const clone = {};

  for (const key of Reflect.ownKeys(obj)) {
    const descriptor = Object.getOwnPropertyDescriptor(obj, key);
    if (descriptor) {
      // Make the property writable and configurable
      Object.defineProperty(clone, key, {
        ...descriptor,
        configurable: true,
        writable: true,
      });
    }
  }

  return clone;
};

const wrapFunctions = (module: any) => {
  const wrappedModule: any = {};

  for (const key of Reflect.ownKeys(module)) {
    const origMethod = module[key];

    const runtime = getRuntime();
    if (runtime.includes('extension') && typeof origMethod === 'function') {
      wrappedModule[key] = async function (...args: unknown[]) {
        console.log(`Calling function ${String(key)} with arguments: ${args}`);

        try {
          const res = await sendToBackgroundV2({
            name: String(key),
            type: 'apiRequest',
            source: getRuntime(),
            target: module,
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
    } else {
      wrappedModule[key] = origMethod;
    }
  }

  return wrappedModule as typeof requestModule;
};

const wrappedRequestModule = () => {
  return wrapFunctions(requestModule);
};

export default wrappedRequestModule;
