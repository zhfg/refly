import { getMarkdown } from '@refly/utils/html2md';
import { BackgroundMsgType, sendToBackground } from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';

export const saveMockedResource = async () => {
  /**
   * TODO: @mrcfps replace pageContent to markdown
   */
  const pageContent = getMarkdown(document?.body);
  const resource = {
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

  sendToBackground(
    {
      name: 'currentMockResource',
      type: 'operateTabStorage',
      body: resource,
      source: getRuntime(),
    },
    false,
  );

  return resource;
};
