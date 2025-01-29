import { UpsertResourceRequest } from '@refly/openapi-schema';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { getMarkdown } from '@refly/utils/html2md';
import { getClientOrigin } from '@refly/utils/url';

export const useSaveSelectedContent = () => {
  const saveSelectedContent = async (targetOrContent: HTMLElement | string) => {
    try {
      // Get the content either from HTMLElement or use the string directly
      const content =
        typeof targetOrContent === 'string' ? targetOrContent : getMarkdown(targetOrContent);

      // Get the current page title and URL
      const title = document?.title || 'Untitled';
      const url = document?.location?.href || 'https://www.refly.ai';

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

      const resourceId = data?.data?.resourceId;
      const resourceUrl = `${getClientOrigin(false)}/resource/${resourceId}`;

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
