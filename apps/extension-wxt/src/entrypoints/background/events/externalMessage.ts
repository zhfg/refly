import { storage } from '@refly-packages/ai-workspace-common/utils/storage';
import { safeParseJSON } from '@refly-packages/ai-workspace-common/utils/parse';
import { Runtime, browser } from 'wxt/browser';
import { getLastActiveTab } from '@refly-packages/ai-workspace-common/utils/extension/tabs';

export const onExternalMessage = async (
  msg: any,
  sender: Runtime.MessageSender,
  sendResponse: (response?: any) => void,
) => {
  console.log('onMessageExternal msg', msg);
  if (msg?.name === 'refly-login-notify') {
    const loginNotifyStr = await storage.getItem('sync:login-notify');
    const userProfile = safeParseJSON(loginNotifyStr);

    if (!userProfile) {
      // 回复消息，关闭弹窗
      const lastActiveTab = await getLastActiveTab();

      console.log('lastTabId', lastActiveTab);
      if (lastActiveTab?.id && lastActiveTab?.windowId) {
        await browser.windows.update(parseInt(lastActiveTab?.windowId as any), {
          focused: true,
        });
        await browser.tabs.update(parseInt((lastActiveTab?.id as any) || ''), {
          active: true,
        });
      }

      await storage.setItem('sync:refly-login-notify', JSON.stringify(msg));
      if (lastActiveTab?.id) {
        // for content script
        await browser.tabs
          .sendMessage(lastActiveTab?.id as number, {
            name: 'refly-login-notify',
            body: msg?.body,
          })
          .catch((err) => {
            console.log('onExternalMessage refly-login-notify send content script message error', err);
          });
      }

      // for sidePanel
      await browser.runtime
        .sendMessage({
          name: 'refly-login-notify',
          body: msg?.body,
        })
        .catch((err) => {
          console.log('onExternalMessage refly-login-notify send sidePanel message error', err);
        });
    }
  }

  if (msg?.name === 'logout-notify') {
    await storage.removeItem('sync:refly-login-notify');
    browser.tabs
      .sendMessage(sender?.tab?.id!, {
        name: 'refly-logout-notify',
      })
      .catch((err) => {
        console.log('onExternalMessage logout-notify send message error', err);
      });
  }
};
