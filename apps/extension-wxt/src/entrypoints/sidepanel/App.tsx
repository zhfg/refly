import { Button, Spin } from '@arco-design/web-react';
import { AppRouter } from '@/routes/index';
import { createClient, client } from '@hey-api/client-fetch';

import '@/styles/style.css';
import './App.scss';
import { Suspense, useEffect } from 'react';

// i18n
// 加载国际化
import '@/i18n/config';
// 加载 runtime 设置
import { getEnv, getRuntime, setRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { useSiderStore } from '@refly-packages/ai-workspace-common/stores/sider';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { useMockInAppResource } from '@/hooks/use-mock-in-app-resource';
/**
 * 打开 popup 页面的规则
 * 1. 如果是
 */
const App = () => {
  const siderStore = useSiderStore();
  const userStore = useUserStore();

  // 在网页时，模拟在知识库的资源选中状态
  useMockInAppResource();

  useEffect(() => {
    // 针对 sider open 来说，SidePanel 渲染则代表打开 sider，与 Popup/App.tsx 逻辑保持一致
    siderStore.setShowSider(true);
    setRuntime('extension-sidepanel');
    userStore.setRuntime('extension-sidepanel');
  }, []);

  return (
    <Suspense fallback={<Spin style={{ marginTop: '200px auto' }} />}>
      <div className="light app-container">
        {/* <div
        className={quickActionStore.selectedText ? "entry active" : "entry"}
        onClick={(_) => siderStore.setShowSider(!siderStore.showSider)}>
        <img src={Logo} alt="唤起 Refly" style={{ width: 25, height: 25 }} />
        <span>⌘B</span>
      </div> */}
        <div id="refly-app-main" className="main active">
          <AppRouter />
        </div>
      </div>
    </Suspense>
  );
};

export default App;
