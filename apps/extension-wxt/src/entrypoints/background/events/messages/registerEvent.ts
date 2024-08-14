import { BackgroundMessage } from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { Runtime, Tabs, browser } from 'wxt/browser';
import { storage } from 'wxt/storage';

export const handleRegisterSidePanel = async (msg: BackgroundMessage) => {
  console.log('handleRegisterSidePanel', msg);

  if (msg?.body?.isArc) {
    const path = browser.runtime.getURL('/popup.html');
    browser.action.onClicked.addListener(async () => {
      console.log('action click');
      browser.browserAction.openPopup();
      browser.action.openPopup();
    });
    browser.action.setPopup({ popup: path });
    console.log('register popup success');
  } else {
    const isSetSidePanel = await storage.getItem('local:isSetSidePanel');
    if (isSetSidePanel) {
      return;
    } else {
      await storage.setItem('local:isSetSidePanel', true);
    }
    // @ts-ignore
    browser?.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .then(() => {
        console.log('register sidePanel success');
      })
      .catch((error: any) => console.error(`sidePanel open error: `, error));
  }
};

export const handleRegisterEvent = async (msg: BackgroundMessage) => {
  if (msg?.name === 'registerSidePanel') {
    handleRegisterSidePanel(msg);
  }
};
