import { useSiderStore } from '@refly-packages/ai-workspace-common/stores/sider';
import { useEffect } from 'react';
import { useExtensionMessage } from './use-extension-message';

interface SiderBarStatus {
  name: string;
  toggle: boolean;
}

export const useSiderBarOpen = () => {
  const siderStore = useSiderStore();

  const [siderBarStatusData] = useExtensionMessage<SiderBarStatus>('runRefly', (req, res) => {
    console.log('runRefly', req, res);
    const { showSider } = useSiderStore.getState();
    res.send(showSider ? 'true' : 'false');
  });

  const handlerSiderOpen = (data?: SiderBarStatus) => {
    const { showSider } = useSiderStore.getState();
    if (data?.name === 'runRefly' && data?.toggle) {
      siderStore.setShowSider(!showSider);
    }
  };

  useEffect(() => {
    handlerSiderOpen(siderBarStatusData);
  }, [siderBarStatusData]);
};
