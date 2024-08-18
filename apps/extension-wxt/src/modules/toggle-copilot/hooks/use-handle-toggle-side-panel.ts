import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { onMessage, sendMessage } from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { BackgroundMessage, CopilotMsgName } from '@refly/common-types';
import { useRef } from 'react';

export const useToggleSidePanel = () => {
  const messageListenerEventRef = useRef<any>();

  const onMessageHandler = (event: MessageEvent<any>) => {
    const data = event as any as BackgroundMessage;
    const { name } = data || {};

    if ((name as CopilotMsgName) === 'toggleCopilotSidePanel') {
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
  };

  const initMessageListener = () => {
    onMessage(onMessageHandler, getRuntime()).then((clearEvent) => {
      messageListenerEventRef.current = clearEvent;
    });

    return () => {
      messageListenerEventRef.current?.();
    };
  };

  return {
    initMessageListener,
  };
};
