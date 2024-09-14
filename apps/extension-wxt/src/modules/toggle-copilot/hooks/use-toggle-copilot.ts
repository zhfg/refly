import { useEffect, useRef, useState } from 'react';
import { sendMessage } from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import pTimeout from 'p-timeout';
import { checkPageUnsupported } from '@refly-packages/ai-workspace-common/utils/extension/check';
import { checkBrowserArc } from '@/utils/browser';
import { SidePanelAction, ToggleCopilotStatus } from '@/types/sidePanel';
import { storage } from '@refly-packages/ai-workspace-common/utils/storage';

let toggleCopilotStatus = {} as ToggleCopilotStatus;

export const useToggleCopilot = () => {
  const isCopilotOpenRef = useRef<boolean>();
  const isArcBrowserRef = useRef<boolean>();

  const handleToggleCopilot = async (params?: { action?: SidePanelAction }) => {
    // with action, always open, toggle selector, and notify toggle status
    const isCopilotOpen = isCopilotOpenRef.current;
    isCopilotOpenRef.current = !isCopilotOpen;
    const { action } = params || {};

    await handleCheckArcBrowser();

    // for sync status to content script ui or sidePanel
    if (action) {
      if (action?.name === 'openContentSelector') {
        toggleCopilotStatus.openContentSelector = true;
        await storage.setItem('local:toggleCopilotStatus', JSON.stringify({ openContentSelector: action?.value }));
      }
    } else {
      // if (Object.keys(toggleCopilotStatus).length !== 0) {
      //   await storage.removeItem('local:toggleCopilotStatus');
      //   toggleCopilotStatus = {} as ToggleCopilotStatus;
      // }
    }

    if (isArcBrowserRef.current) {
      sendMessage({
        type: 'others',
        name: 'toggleCopilotCSUI',
        body: {
          isArcBrowser: isArcBrowserRef.current,
          isCopilotOpen: action && action?.value ? true : !isCopilotOpen,
          action,
        },
        source: getRuntime(),
      });
    } else {
      sendMessage({
        type: 'toggleCopilot',
        name: 'toggleCopilotSidePanel',
        body: {
          isArcBrowser: isArcBrowserRef.current,
          isCopilotOpen: action && action?.value ? true : !isCopilotOpen,
          action,
        },
        source: getRuntime(),
      });
    }
  };

  /**
   * 1. 检查是否是 arc 浏览器标签
   * 2. 是，则打开 content script ui，否则打开 sidePanel
   * 3. 直接发送 toggleSidePanel
   */
  const handleCheckArcBrowser = async () => {
    if (!checkPageUnsupported(window.location.href)) {
      const isArc = await checkBrowserArc();
      isArcBrowserRef.current = isArc;
    }
  };

  // initial check side panel open status
  const handleCheckSidePanelOpenStatus = async () => {
    try {
      const promise = new Promise(async (resolve) => {
        try {
          const res = await sendMessage({
            type: 'others',
            name: 'checkSidePanelOpenStatus',
            source: getRuntime(),
          });
          isCopilotOpenRef.current = res?.isCopilotOpen;
          resolve(res);
        } catch (error) {
          console.error(`checkSidePanelOpenStatus error: ${error}`);
          isCopilotOpenRef.current = false;
          resolve(false);
        }
      });

      await pTimeout(promise, { milliseconds: 1000 });
    } catch (error) {
      console.error(`checkSidePanelOpenStatus error: ${error}`);
      isCopilotOpenRef.current = false;
    }
  };

  useEffect(() => {
    handleCheckArcBrowser();
    handleCheckSidePanelOpenStatus();
  }, []);

  return {
    handleToggleCopilot,
  };
};
