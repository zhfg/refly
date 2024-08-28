import { Spin } from '@arco-design/web-react';
import { AppRouter } from '@/routes/index';

import '@/styles/style.css';
import './App.scss';
import { Suspense, useEffect, useRef } from 'react';

// i18n
// 加载国际化
import '@/i18n/config';
// 加载 runtime 设置
import { setRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { useCopilotStore } from '@/modules/toggle-copilot/stores/copilot';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { useMockInAppResource } from '@/hooks/use-mock-in-app-resource';
import { useToggleSidePanel } from '@/modules/toggle-copilot/hooks/use-handle-toggle-side-panel';
/**
 * 打开 popup 页面的规则
 * 1. 如果是
 */
const App = () => {
  const copilotStore = useCopilotStore();
  const userStore = useUserStore();
  const { initMessageListener } = useToggleSidePanel();

  // 在网页时，模拟在知识库的资源选中状态
  const { initMessageListener: initMockMessageListener } = useMockInAppResource();

  useEffect(() => {
    // 针对 sider open 来说，SidePanel 渲染则代表打开 sider，与 Popup/App.tsx 逻辑保持一致
    copilotStore.setIsCopilotOpen(true);
    setRuntime('extension-sidepanel');
    userStore.setRuntime('extension-sidepanel');
  }, []);
  useEffect(() => {
    initMessageListener();
    initMockMessageListener();
  }, []);

  return (
    <Suspense fallback={<Spin style={{ marginTop: '200px auto' }} />}>
      <div className="light app-container">
        <div id="refly-app-main" className="main active">
          <AppRouter />
        </div>
      </div>
    </Suspense>
  );
};

export default App;
