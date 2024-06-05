import { storage } from 'wxt/storage';
import { safeParseJSON } from '@/utils/parse';
import { Runtime, browser } from 'wxt/browser';
import { getLastActiveTab } from '@/utils/extension/tabs';

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
      browser.tabs.sendMessage(sender?.tab?.id!, {
        name: 'refly-login-notify',
      });

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
    }
  }

  if (msg?.name === 'logout-notify') {
    await storage.removeItem('sync:refly-login-notify');
    browser.tabs.sendMessage(sender?.tab?.id!, {
      name: 'refly-logout-notify',
    });
  }
};
