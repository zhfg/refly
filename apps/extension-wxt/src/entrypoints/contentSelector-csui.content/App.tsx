import { useContentSelector } from '@refly-packages/ai-workspace-common/modules/content-selector/hooks/use-content-selector';
import { useEffect } from 'react';

// 在使用的地方导入 content selector 的样式
import '@refly-packages/ai-workspace-common/modules/content-selector/styles/content-selector.scss';

export const App = () => {
  const { initContentSelectorElem, initMessageListener } = useContentSelector(null, 'extension-weblink');

  useEffect(() => {
    initMessageListener();
  }, []);

  return <>{initContentSelectorElem()}</>;
};
