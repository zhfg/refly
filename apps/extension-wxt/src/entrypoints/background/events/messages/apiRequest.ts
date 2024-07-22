import { Runtime, Tabs, browser } from 'wxt/browser';
import { extRequest } from '@/utils/request';
import { HandlerRequest, HandlerResponse } from '@refly/common-types';
import { getCurrentTab, getLastActiveTab, saveLastActiveTab } from '@/utils/extension/tabs';
import * as requestModule from '@refly/openapi-schema';
import { BackgroundMessage } from '@refly/ai-workspace-common/utils/extension/messaging';
import { createClient } from '@hey-api/client-fetch';
import { getServerOrigin } from '@refly/utils/url';
import { getCookie } from '@/utils/cookie';
import { appConfig } from '@refly/utils/config';

/**
 * @deprecated
 */
export const handleRequest = async (msg: HandlerRequest<any>) => {
  const lastActiveTab = await getLastActiveTab();
  const url = appConfig?.url[msg.name as keyof typeof appConfig.url] || '';
  const [err, userRes] = await extRequest(url as string, { ...msg });
  let messageRes = {} as HandlerResponse<any>;

  if (err) {
    messageRes = {
      success: false,
      errMsg: err,
    };
  } else {
    messageRes = {
      success: true,
      data: userRes,
    };
  }

  await browser.tabs.sendMessage(lastActiveTab?.id as number, {
    name: msg?.name,
    body: messageRes,
  });
};

const client = createClient({ baseUrl: getServerOrigin() + '/v1' });

client.interceptors.request.use(async (request) => {
  console.log('extension intercept request:', request);
  const token = await getCookie();
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
});

export const handleRequestReflect = async (msg: BackgroundMessage) => {
  console.log('reflect msg', msg);
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
