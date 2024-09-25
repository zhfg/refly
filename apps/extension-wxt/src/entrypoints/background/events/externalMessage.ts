import { storage } from '@refly-packages/ai-workspace-common/utils/storage';
import { Runtime, browser } from 'wxt/browser';

export const onExternalMessage = async (
  msg: any,
  sender: Runtime.MessageSender,
  sendResponse: (response?: any) => void,
) => {
  console.log('onMessageExternal msg', msg);
  if (msg?.name === 'external-refly-login-notify') {
    await storage.setItem('sync:refly-login-notify', JSON.stringify({ login: true }));
  }

  if (msg?.name === 'external-refly-logout-notify') {
    await storage.setItem('sync:refly-login-notify', JSON.stringify({ login: false }));
  }
};
