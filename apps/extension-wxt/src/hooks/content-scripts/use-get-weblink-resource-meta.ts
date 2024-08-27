import { useEffect } from 'react';
import { useMatch } from '@refly-packages/ai-workspace-common/utils/router';
import { useExtensionMessage } from '../use-extension-message';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';

// utils
import { saveMockedResource } from '@/utils/save-mocked-resource';

/**
 * 只在 Content Script UI 中调用
 */
export const useSyncWeblinkResourceMeta = async () => {
  const [pageOnActivated] = useExtensionMessage<{ name: string }>('reflyStatusCheck', (_, { send }) => {
    if (getRuntime() === 'extension-csui') {
      console.log('useSyncWeblinkResourceMeta');
      makeTempResourceAndSave();
    }
  });

  const makeTempResourceAndSave = async () => {
    await saveMockedResource();
  };

  useEffect(() => {
    makeTempResourceAndSave();
  }, []);
};
