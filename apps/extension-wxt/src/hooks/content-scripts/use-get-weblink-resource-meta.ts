import { useKnowledgeBaseStore } from '@refly/ai-workspace-common/stores/knowledge-base';
import { BackgroundMsgType, sendToBackground } from '@refly/ai-workspace-common/utils/extension/messaging';
import { ResourceDetail } from '@refly/openapi-schema';
import { useEffect } from 'react';
import { browser } from 'wxt/browser';
import { useMatch } from '@refly/ai-workspace-common/utils/router';
import { getRuntime } from '@refly/ai-workspace-common/utils/env';

/**
 * 只在 Content Script UI 中调用
 */
export const useSyncWeblinkResourceMeta = async () => {
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const isHomepage = useMatch('/');

  const makeTempResourceAndSave = () => {
    const resource: Partial<ResourceDetail> = {
      resourceId: 'tempResId',
      title: document?.title || '',
      data: {
        url: location.href,
        title: document?.title || '',
      },
      resourceType: 'weblink',
      indexStatus: 'init',
      isPublic: false,
      readOnly: true,
      collabEnabled: false,
    };

    knowledgeBaseStore.updateResource(resource as ResourceDetail);

    sendToBackground(
      {
        name: 'currentMockResource',
        type: 'operateTabStorage',
        body: resource,
        source: getRuntime(),
      },
      false,
    );
  };

  useEffect(() => {
    if (isHomepage) {
      makeTempResourceAndSave();
    }
  }, [isHomepage]);
};
