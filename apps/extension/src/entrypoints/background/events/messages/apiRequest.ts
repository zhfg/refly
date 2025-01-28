import { browser } from 'wxt/browser';
import { getLastActiveTab } from '@refly-packages/ai-workspace-common/utils/extension/tabs';
import * as requestModule from '@refly/openapi-schema';
import { BackgroundMessage } from '@refly/common-types';
import { createClient } from '@hey-api/client-fetch';
import { getExtensionServerOrigin } from '@refly/utils/url';
import { getCookie } from '@/utils/cookie';
import { getToken } from '../../index';

const client = createClient({ baseUrl: `${getExtensionServerOrigin()}/v1` });

client.interceptors.request.use(async (request) => {
  const token = (await getCookie()) || getToken();
  console.log('token', token);
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
});

export const handleRequestReflect = async (msg: BackgroundMessage) => {
  // @ts-ignore
  const res = await requestModule[msg.name as keyof typeof requestModule]?.call?.(null, {
    ...msg.args?.[0],
    client,
  });
  const lastActiveTab = await getLastActiveTab();

  if (msg?.source === 'extension-csui') {
    await browser.tabs.sendMessage(lastActiveTab?.id as number, {
      name: msg?.name,
      body: res,
    });
  } else if (msg?.source === 'extension-sidepanel') {
    try {
      await browser.runtime.sendMessage({
        name: msg?.name,
        body: res,
      });
    } catch (err) {
      console.log('handleRequestReflect send message error', err);
    }
  }
};
