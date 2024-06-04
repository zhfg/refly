import { onExternalMessage } from './events/externalMessage';
import { onActivated } from './events/activated';
import { onMessage } from './events/message';
import { onPort } from './events/ports';
import { setRuntime } from '@refly/ai-workspace-common/utils/env';
import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/sandbox';
import { getCurrentTab } from '@/utils/extension/tabs';

export default defineBackground(() => {
  setRuntime('extension');

  console.log('hello background');
  // 接收 refly 官网的消息，了解登录的状态
  browser.runtime.onMessageExternal.addListener(onExternalMessage);
  browser.tabs.onActivated.addListener(onActivated);
  browser.runtime.onMessage.addListener(onMessage);
  browser.runtime.onConnect.addListener(onPort);

  chrome.action.onClicked.addListener((tab) => {
    chrome.action.setTitle({
      tabId: tab.id,
      title: `You are on tab: ${tab.id}`,
    });
  });
});
