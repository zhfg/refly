import { useEffect } from 'react';

import './App.scss';

// hooks
// 设置 runtime 环境
import { getEnv, setRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { useSyncWeblinkResourceMeta } from '@/hooks/content-scripts/use-get-weblink-resource-meta';
import { checkBrowserArc } from '@/utils/browser';
import { checkPageUnsupported } from '@refly-packages/ai-workspace-common/utils/extension/check';

const App = () => {
  // 在挂载时记录当前资源,Only for Content Script
  useSyncWeblinkResourceMeta();

  useEffect(() => {
    if (!checkPageUnsupported(location.href)) {
      checkBrowserArc();
    }
  }, []);
  useEffect(() => {
    setRuntime('extension-csui');
  }, []);

  return <></>;
};

export default App;
