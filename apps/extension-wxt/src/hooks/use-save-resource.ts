import { CreateResourceData } from '@refly/openapi-schema';
import { getMarkdown } from '@refly/utils/html2md';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { getClientOrigin } from '@refly/utils/url';

export const useSaveCurrentWeblinkAsResource = () => {
  const saveResource = async () => {
    try {
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

      const createResourceData: CreateResourceData = {
        body: {
          resourceType: 'weblink',
          data: resource?.data,
          content: resource?.content,
        },
      };

      const { data } = await getClient().createResource(createResourceData);
      const resourceId = data?.data?.resourceId;
      const url = `${getClientOrigin(false)}/knowledge-base?resId=${resourceId}`;

      return { success: true, url };
    } catch (err) {
      console.error(err);
      return { success: false, url: '' };
    }
  };

  return { saveResource };
};
