import { useContentSelector } from '@refly-packages/ai-workspace-common/modules/content-selector/hooks/use-content-selector';
import { useEffect } from 'react';

import '@/i18n/config';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/modules/content-selector/utils/get-popup-container';
import { Message } from '@arco-design/web-react';

export const App = () => {
  const { initContentSelectorElem, initMessageListener } = useContentSelector(null, 'extensionWeblinkSelection', {
    url: document?.location?.href || (document as any as Location)?.href || '',
  });

  useEffect(() => {
    Message.config({
      getContainer: () => getPopupContainer() as HTMLElement,
    });
  }, []);
  useEffect(() => {
    initMessageListener();
  }, []);

  return <div className="main">{initContentSelectorElem()}</div>;
};
