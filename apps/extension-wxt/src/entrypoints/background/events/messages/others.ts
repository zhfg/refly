import { tempTabState } from '@/entrypoints/background/index';
import { BackgroundMessage } from '@refly/ai-workspace-common/utils/extension/messaging';
import { getCurrentTab } from '@refly/ai-workspace-common/utils/extension/tabs';
import { safeParseJSON } from '@refly/ai-workspace-common/utils/parse';
import { storage } from '@refly/ai-workspace-common/utils/storage';
import { browser } from 'wxt/browser';

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
};
