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
  type: BackgroundMsgType;
  source: IRuntime;
  target: any;
  thisArg: any;
  args: any;
}

export const sendToBackgroundV2 = async (message: BackgroundMessage) => {
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
};

const proxiedRequestModule = new Proxy(requestModule, {
  get(target, propKey, receiver) {
    // console.log('accessing proxied module', target, propKey, receiver);
    const origMethod = target[propKey as keyof typeof requestModule];

    if (getRuntime()?.includes('extension') && typeof origMethod === 'function') {
      // The return function type is unknown because we don't know the exact signature of each function
      return async function (thisArg: unknown, ...args: unknown[]) {
        console.log(`Calling function ${String(propKey)} with arguments: ${args}`);

        try {
          const res = await sendToBackgroundV2({
            name: String(propKey),
            type: 'apiRequest',
            source: getRuntime(),
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
