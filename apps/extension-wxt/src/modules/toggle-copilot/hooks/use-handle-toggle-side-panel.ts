import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { onMessage, sendMessage } from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { BackgroundMessage, CopilotMsgName } from '@refly/common-types';
import { useEffect, useRef } from 'react';
import { storage } from '@refly-packages/ai-workspace-common/utils/storage';
import { ToggleCopilotStatus } from '@/types/sidePanel';
import { useHandleContextWorkflow } from '@refly-packages/ai-workspace-common/modules/content-selector/hooks/use-handle-context-workflow';
import { safeParseJSON } from '@refly/utils/parse';

export const useToggleSidePanel = () => {
  const messageListenerEventRef = useRef<any>();
  const { handlePassthroughOpenContentSelector } = useHandleContextWorkflow();

  const onMessageHandler = async (event: MessageEvent<any>) => {
    const data = event as any as BackgroundMessage;
    const { name, body } = data || {};

    console.log('onSidePanelMessage', event);
    if (
      (name as CopilotMsgName) === 'toggleCopilotSidePanel' &&
      typeof body?.isCopilotOpen === 'boolean' &&
      !body?.isCopilotOpen
    ) {
      window.close();
    }

    if ((name as CopilotMsgName) === 'checkSidePanelOpenStatus') {
      sendMessage({
        type: 'others',
        name: 'checkSidePanelOpenStatus',
        body: {
          isCopilotOpen: true,
        },
        source: getRuntime(),
      });
    }

    // 1. when sidePanel already open, handle toggleSidePanel action with message
    if ((name as CopilotMsgName) === 'toggleCopilotSidePanel' && body?.action) {
      if (body?.action?.name === 'openContentSelector' && body?.action?.value) {
        handlePassthroughOpenContentSelector();
      }
    }
  };

  const initMessageListener = () => {
    onMessage(onMessageHandler, getRuntime()).then((clearEvent) => {
      messageListenerEventRef.current = clearEvent;
    });

    return () => {
      messageListenerEventRef.current?.();
    };
  };

  // 2. when sidePanel not open, use floatSphere to open, init handle storage
  const handleOpenContentSelector = async () => {
    const toggleCopilotStatusStr = await storage.getItem('local:toggleCopilotStatus');
    const toggleCopilotStatus = safeParseJSON(toggleCopilotStatusStr) as ToggleCopilotStatus;
    console.log('toggleCopilotStatus', toggleCopilotStatus);
    if (toggleCopilotStatus?.openContentSelector) {
      handlePassthroughOpenContentSelector();
    }

    await storage.removeItem('local:toggleCopilotStatus');
  };

  useEffect(() => {
    handleOpenContentSelector();
  }, []);

  return {
    initMessageListener,
  };
};
