import { useCopilotStore } from '@/modules/toggle-copilot/stores/copilot';
import { useEffect } from 'react';
import { useExtensionMessage } from '../../../hooks/use-extension-message';

interface CopilotStatus {
  name: string;
  toggle: boolean;
}

export const useCopilotOpen = () => {
  const copilotStore = useCopilotStore();

  const [copilotStatusData] = useExtensionMessage<CopilotStatus>('toggleCopilotFromPopup', (req, res) => {
    console.log('toggleCopilotFromPopup', req, res);
    const { isCopilotOpen } = useCopilotStore.getState();
    res.send(isCopilotOpen ? 'true' : 'false');
  });

  const handlerCopilotOpen = (data?: CopilotStatus) => {
    const { isCopilotOpen } = useCopilotStore.getState();
    if (data?.name === 'runtoggleCopilotFromPopupRefly' && data?.toggle) {
      copilotStore.setIsCopilotOpen(!isCopilotOpen);
    }
  };

  useEffect(() => {
    handlerCopilotOpen(copilotStatusData);
  }, [copilotStatusData]);
};
