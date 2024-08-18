import { handleGetOpenedTabs } from '@/entrypoints/background/events/messages/getOpenedTabs';
import { tempTabState } from '@/entrypoints/background/index';
import { getCurrentTab } from '@refly-packages/ai-workspace-common/utils/extension/tabs';
import { safeParseJSON } from '@refly-packages/ai-workspace-common/utils/parse';
import { storage } from '@refly-packages/ai-workspace-common/utils/storage';
import { browser } from 'wxt/browser';
import { BackgroundMessage } from '@refly/common-types';

export const handleOtherMessage = async (msg: BackgroundMessage) => {
  if (msg?.name === 'getTabId') {
    const lastActiveTab = await getCurrentTab();

    if (!lastActiveTab?.id) return;

    if (msg?.source === 'extension-csui') {
      browser.tabs.sendMessage(lastActiveTab?.id as number, {
        name: msg?.name,
        body: { tabId: lastActiveTab?.id },
      });
    } else if (msg?.source === 'extension-sidepanel') {
      browser.runtime.sendMessage({
        name: msg?.name,
        body: { tabId: lastActiveTab?.id },
      });
    }
  }

  if (msg?.name === 'getCurrentMockResourceByTabId') {
    const lastActiveTab = await getCurrentTab();
    if (!lastActiveTab?.id) return;

    const currentMockResource = safeParseJSON(tempTabState?.[`${lastActiveTab?.id}_currentMockResource`]);

    if (msg?.source === 'extension-csui') {
      browser.tabs.sendMessage(lastActiveTab?.id as number, {
        name: msg?.name,
        body: { currentMockResource },
      });
    } else if (msg?.source === 'extension-sidepanel') {
      browser.runtime.sendMessage({
        name: msg?.name,
        body: { currentMockResource },
      });
    }
  }

  if (msg?.name === 'getOpenedTabs') {
    return await handleGetOpenedTabs(msg);
  }
};
