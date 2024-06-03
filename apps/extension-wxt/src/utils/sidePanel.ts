import { browser } from 'wxt/browser';
import { getCurrentTab } from './extension/tabs';
import { storage } from 'wxt/storage';

export const checkSidePanelSupport = async () => {
  try {
    const currentTab = await getCurrentTab();
    const panel = await browser.sidebarAction.getPanel({ tabId: currentTab?.id, windowId: currentTab.windowId });
    if (panel) {
      storage.setItem('sync:sidePanelSupport', 'true');
    } else {
      storage.setItem('sync:sidePanelSupport', 'false');
    }
  } catch (e) {
    // 浏览器不支持 Side Panel API
    storage.setItem('sync:sidePanelSupport', 'false');
  }
};

export const getSidePanelSupport = async () => {
  const res = await storage.getItem('sync:sidePanelSupport');

  if (res && res === 'true') {
    return true;
  }

  return false;
};
