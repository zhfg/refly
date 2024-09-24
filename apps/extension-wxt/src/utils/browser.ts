import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { sendToBackground } from '@refly-packages/ai-workspace-common/utils/extension/messaging';

let isArc: boolean | undefined = undefined;
export const checkBrowserArc = async () => {
  try {
    console.log('parent', window.parent);
    isArc = getComputedStyle(window.parent?.document.documentElement).getPropertyValue('--arc-palette-title')
      ? true
      : false;

    if (!isArc) {
      sendToBackground({
        type: 'registerEvent',
        name: 'registerSidePanel',
        body: {
          isArc: false,
        },
        source: getRuntime(),
      });
    } else {
      sendToBackground({
        type: 'registerEvent',
        name: 'unregisterSidePanel',
        body: {
          isArc: true,
        },
        source: getRuntime(),
      });
    }

    return isArc;
  } catch (err) {
    console.log('checkBrowserArc err: ', err);
    return false;
  }
};
