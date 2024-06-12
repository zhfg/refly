import { handleUpdateTabStorage } from '@/entrypoints/background/events/messages/operateStorage';
import { Tabs, browser } from 'wxt/browser';

export const onDetached = (tabId: number, detachInfo: Tabs.OnDetachedDetachInfoType) => {
  // 在此处处理标签切换
  console.log('Tab with ID ' + tabId + ' was detached in window ' + detachInfo.oldWindowId);

  handleUpdateTabStorage(
    { name: 'currentMockResource', body: null, source: 'extension-background', type: 'operateTabStorage' },
    tabId,
  );
};
