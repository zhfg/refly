import { storage } from 'wxt/storage';
import { sendToBackground } from './extension/messaging';

export const checkBrowserArc = async () => {
  try {
    const storageValue = await storage.getItem('sync:isArc');
    if (storageValue) return;

    console.log('parent', window.parent);
    const isArc = getComputedStyle(window.parent?.document.documentElement).getPropertyValue('--arc-palette-title')
      ? true
      : false;

    storage.setItem('sync:isArc', isArc);
    console.log('checkBrowserArc success: ', isArc);

    if (!isArc) {
      sendToBackground({
        type: 'registerEvent',
        name: 'registerSidePanel',
        body: {
          isArc: false,
        },
      });
    }
  } catch (err) {
    console.log('checkBrowserArc err: ', err);
  }
};
