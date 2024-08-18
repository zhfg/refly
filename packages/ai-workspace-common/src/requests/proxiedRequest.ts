import { createClient, client } from '@hey-api/client-fetch';
import * as requestModule from '@refly/openapi-schema';

import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { getAuthTokenFromCookie } from '@refly-packages/ai-workspace-common/utils/request';
import { getServerOrigin } from '@refly/utils/url';
import { sendToBackground } from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { MessageName } from '@refly/common-types';

createClient({ baseUrl: getServerOrigin() + '/v1' });

client.interceptors.request.use((request) => {
  console.log('intercept request:', request);
  const token = getAuthTokenFromCookie();
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
});

const wrapFunctions = (module: any) => {
  const wrappedModule: any = {};

  for (const key of Reflect.ownKeys(module)) {
    const origMethod = module[key];

    const runtime = getRuntime() || '';
    if (runtime.includes('extension') && typeof origMethod === 'function') {
      wrappedModule[key] = async function (...args: unknown[]) {
        console.log(`Calling function ${String(key)} with arguments: ${args}`);

        try {
          const res = await sendToBackground({
            name: String(key) as MessageName,
            type: 'apiRequest',
            source: getRuntime(),
            target: module,
            args,
          });

          return res;
        } catch (err) {
          return {
            success: false,
            errMsg: err,
          };
        }
      };
    } else {
      wrappedModule[key] = origMethod;
    }
  }

  return wrappedModule as typeof requestModule;
};

const wrappedRequestModule = () => {
  return wrapFunctions(requestModule);
};

export default wrappedRequestModule;
