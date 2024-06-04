import { Button, Spin } from '@arco-design/web-react';
import { MemoryRouter } from 'react-router-dom';
import { useSiderStore } from '@refly/ai-workspace-common/stores/sider';
import { ContentRouter } from '@/components/router';

import '@/styles/style.css';
import './App.scss';
import { Suspense, useEffect } from 'react';

// i18n
// 加载国际化
import '@/i18n/config';
import { useChatStore } from '@refly/ai-workspace-common/stores/chat';
import { fakeMessages } from '../../fake-data/message';
// 加载 runtime 设置
import { getEnv, setRuntime } from '@refly/ai-workspace-common/utils/env';
/**
 * 打开 popup 页面的规则
 * 1. 如果是
 */
const App = () => {
  const siderStore = useSiderStore();
  const chatStore = useChatStore();

  setRuntime('web');

  useEffect(() => {
    chatStore.setMessages(fakeMessages as any);
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
          <MemoryRouter>
            <ContentRouter />
          </MemoryRouter>
        </div>
      </div>
    </Suspense>
  );
};

export default App;
