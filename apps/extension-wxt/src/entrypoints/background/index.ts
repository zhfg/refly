import { onExternalMessage } from './events/externalMessage';
import { onActivated } from './events/activated';
import { onMessage } from './events/messages/index';
import { onPort } from './events/ports';
import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/sandbox';
import { onDetached } from './events/detached';
import { handleToggleCopilotSidePanel } from './events/messages/toggleCopilot';
import { Runtime } from 'wxt/browser';

export const tempTabState: { [key: string]: string } = {};

export default defineBackground(() => {
  // 接收 refly 官网的消息，了解登录的状态
  browser.runtime.onMessageExternal.addListener(onExternalMessage);
  browser.tabs.onActivated.addListener(onActivated);
  browser.tabs.onDetached.addListener(onDetached);
  browser.runtime.onMessage.addListener(onMessage);
  browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'toggleCopilot' && msg.name === 'toggleCopilotSidePanel') {
      return handleToggleCopilotSidePanel(msg, sender);
    }
  });
  browser.runtime.onConnect.addListener(onPort);
});
