import { CreateResourceData } from '@refly/openapi-schema';
import { getMarkdown, getReadabilityMarkdown } from '@refly/utils/html2md';
import getClient, {
  extractBaseResp,
} from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { getClientOrigin } from '@refly/utils/url';
import { getRuntime } from '@refly/utils/env';
import { ConnectionError } from '@refly/errors';

export const useSaveCurrentWeblinkAsResource = () => {
  const saveResource = async () => {
    try {
      const runtime = getRuntime();
      const isWeb = runtime === 'web';
      const pageContent = isWeb
        ? getMarkdown(document?.body)
        : getReadabilityMarkdown(document?.body ? document?.body : document);
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
          title: resource?.title,
          resourceType: 'weblink',
          data: resource?.data,
          content: resource?.content,
        },
      };

      const { error } = await getClient().createResource(createResourceData);
      // const resourceId = data?.data?.resourceId;
      // const url = `${getClientOrigin(false)}/resource/${resourceId}`;
      const url = `${getClientOrigin(false)}`;

      return { url, res: error };
    } catch (err: any) {
      console.error(err);

      return {
        url: '',
        res: {
          errCode: new ConnectionError(err).code,
        },
      };
    }
  };

  return { saveResource };
};
