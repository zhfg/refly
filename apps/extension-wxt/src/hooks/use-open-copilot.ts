import { useEffect, useRef } from 'react';
import { useSiderStore } from '@/stores/sider';
import { sendMessage } from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import pTimeout from 'p-timeout';
import { checkPageUnsupported } from '@refly-packages/ai-workspace-common/utils/extension/check';
import { checkBrowserArc } from '@/utils/browser';
import { getSyncStorage, setSyncStorage } from '@refly-packages/ai-workspace-common/utils/storage';

export const useOpenCopilot = () => {
  const isArcBrowserRef = useRef<boolean>();
  const siderStore = useSiderStore();

  const handleToogleCopilot = async () => {
    const isCopilotOpen = await getSyncStorage('isCopilotOpen');
    setSyncStorage('isCopilotOpen', !isCopilotOpen);
    siderStore.setShowSider(!siderStore.showSider);

    if (isArcBrowserRef.current) {
      sendMessage({
        type: 'others',
        name: 'toggleCopilotCSUI',
        body: {
          show: !siderStore.showSider,
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
          show: !siderStore.showSider,
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

  useEffect(() => {
    handleCheckArcBrowser();
  }, []);

  return {
    handleToogleCopilot,
  };
};
