// requests
import { sendMessage } from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { Mark } from '@refly/common-types';

export const useLoadExtensionWeblinkData = () => {
  const loadExtensionWeblinkData = async () => {
    const res = (await sendMessage({
      name: 'getOpenedTabs',
      type: 'others',
      source: getRuntime(),
    })) as {
      tabs: {
        id: string;
        title: string;
        url: string;
      }[];
    };

    const data: Mark[] = (res?.tabs || []).map((item) => ({
      id: item?.id,
      url: item?.url,
      title: item?.title,
      type: 'extensionWeblink',
      data: '',
    }));
    return { success: true, data };
  };

  return {
    loadExtensionWeblinkData,
  };
};
