import { Button, Spin } from '@arco-design/web-react';
import { MemoryRouter } from 'react-router-dom';
import { useSiderStore } from '@refly/ai-workspace-common/stores/sider';
import { ContentRouter } from '@/components/router';

import './App.scss';
import { Suspense } from 'react';
import { getDefaultPopupContainer } from '@refly/ai-workspace-common/utils/ui';

// i18n
// 加载国际化
import '@/i18n/config';
/**
 * 打开 popup 页面的规则
 * 1. 如果是
 */
const App = () => {
  const siderStore = useSiderStore();

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
            <ContentRouter getPopupContainer={() => getDefaultPopupContainer()} />
          </MemoryRouter>
        </div>
      </div>
    </Suspense>
  );
};

export default App;
