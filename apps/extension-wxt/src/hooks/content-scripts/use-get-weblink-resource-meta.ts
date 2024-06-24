import { useKnowledgeBaseStore } from '@refly/ai-workspace-common/stores/knowledge-base';
import { BackgroundMsgType, sendToBackground } from '@refly/ai-workspace-common/utils/extension/messaging';
import { ResourceDetail, UpsertResourceRequest } from '@refly/openapi-schema';
import { useEffect } from 'react';
import { browser } from 'wxt/browser';
import { useMatch } from '@refly/ai-workspace-common/utils/router';
import { getRuntime } from '@refly/ai-workspace-common/utils/env';
import { getReadabilityHtml } from '@/utils/readability';
import { useExtensionMessage } from '../use-extension-message';

/**
 * 只在 Content Script UI 中调用
 */
export const useSyncWeblinkResourceMeta = async () => {
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const isHomepage = useMatch('/');
  const [pageOnActivated] = useExtensionMessage<{ name: string }>('refly-status-check', (_, { send }) => {
    if (getRuntime() === 'extension-csui') {
      makeTempResourceAndSave();
    }
  });

  const makeTempResourceAndSave = async () => {
    /**
     * TODO: @mrcfps replace pageContent to markdown
     */
    const pageContent = getReadabilityHtml();
    const resource: Partial<UpsertResourceRequest> = {
      resourceId: 'tempResId',
      title: document?.title || '',
      data: {
        url: location.href,
        title: document?.title || '',
      },
      resourceType: 'weblink',
      isPublic: false,
      readOnly: true,
      collabEnabled: false,
      content: pageContent || '',
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
