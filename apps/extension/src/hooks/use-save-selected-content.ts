import { UpsertResourceRequest, type BaseResponse } from '@refly/openapi-schema';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { getClientOrigin } from '@refly/utils/url';
import { ConnectionError } from '@refly/errors';

interface SaveContentMetadata {
  title?: string;
  url?: string;
  res: BaseResponse;
}

export const useSaveSelectedContent = () => {
  const saveSelectedContent = async (
    content: string,
    metadata?: SaveContentMetadata,
  ): Promise<{ url: string; res: BaseResponse }> => {
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

      const { error } = await getClient().createResource({
        body: createResourceData,
      });

      // const resourceId = data?.data?.resourceId;
      // const resourceUrl = `${getClientOrigin(false)}/resource/${resourceId}`;
      const resourceUrl = `${getClientOrigin(false)}`;

      return {
        url: resourceUrl,
        res: error as BaseResponse,
      };
    } catch (err: any) {
      console.error('Failed to save selected content:', err);
      return {
        url: '',
        res: {
          errCode: new ConnectionError(err)?.code,
        } as BaseResponse,
      };
    }
  };

  return { saveSelectedContent };
};
