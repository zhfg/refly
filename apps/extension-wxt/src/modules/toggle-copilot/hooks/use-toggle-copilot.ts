import { useEffect, useRef, useState } from 'react';
import { useSiderStore } from '@/stores/sider';
import { sendMessage } from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import pTimeout from 'p-timeout';
import { checkPageUnsupported } from '@refly-packages/ai-workspace-common/utils/extension/check';
import { checkBrowserArc } from '@/utils/browser';

export const useToggleCopilot = () => {
  const isCopilotOpenRef = useRef<boolean>();
  const isArcBrowserRef = useRef<boolean>();

  const handleToggleCopilot = async () => {
    const isCopilotOpen = isCopilotOpenRef.current;
    isCopilotOpenRef.current = !isCopilotOpen;

    if (isArcBrowserRef.current) {
      sendMessage({
        type: 'others',
        name: 'toggleCopilotCSUI',
        body: {
          isArcBrowser: isArcBrowserRef.current,
          isCopilotOpen: !isCopilotOpen,
        },
        source: getRuntime(),
      });
    } else {
      sendMessage({
        type: 'toggleCopilot',
        name: 'toggleCopilotSidePanel',
        body: {
          isArcBrowser: isArcBrowserRef.current,
          isCopilotOpen: !isCopilotOpen,
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
