import { UpsertResourceRequest } from '@refly/openapi-schema';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { getClientOrigin } from '@refly/utils/url';

interface SaveContentMetadata {
  title?: string;
  url?: string;
}

export const useSaveSelectedContent = () => {
  const saveSelectedContent = async (content: string, metadata?: SaveContentMetadata) => {
    try {
      // Get the current page title and URL or use provided metadata
      const title = metadata?.title || document?.title || 'Untitled';
      const url = metadata?.url || document?.location?.href || 'https://www.refly.ai';

      const createResourceData: UpsertResourceRequest = {
        resourceType: 'text',
        title,
        content: content || '',
        data: {
          url,
          title,
        },
      };

      const { data } = await getClient().createResource({
        body: createResourceData,
      });

      // const resourceId = data?.data?.resourceId;
      // const resourceUrl = `${getClientOrigin(false)}/resource/${resourceId}`;
      const resourceUrl = `${getClientOrigin(false)}`;

      return {
        success: !!data?.success,
        url: resourceUrl,
      };
    } catch (err) {
      console.error('Failed to save selected content:', err);
      return {
        success: false,
        url: '',
      };
    }
  };

  return { saveSelectedContent };
};
