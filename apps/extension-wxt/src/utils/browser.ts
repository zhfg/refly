import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { sendToBackground } from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { storage } from '@refly-packages/ai-workspace-common/utils/storage';

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
        source: getRuntime(),
      });
    }
  } catch (err) {
    console.log('checkBrowserArc err: ', err);
  }
};
