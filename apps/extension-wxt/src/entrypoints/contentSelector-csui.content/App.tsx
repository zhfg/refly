import { useContentSelector } from '@refly-packages/ai-workspace-common/modules/content-selector/hooks/use-content-selector';
import './App.scss';
import { useEffect } from 'react';

export const App = () => {
  const { contentSelectorElem, initMessageListener } = useContentSelector();

  useEffect(() => {
    initMessageListener();
  }, []);

  return <>{contentSelectorElem}</>;
};
