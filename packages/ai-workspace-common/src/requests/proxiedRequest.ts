import { createClient, client } from '@hey-api/client-fetch';
import * as requestModule from '@refly/openapi-schema';

import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { getAuthTokenFromCookie } from '@refly-packages/ai-workspace-common/utils/request';
import { getServerOrigin } from '@refly/utils/url';
import { sendToBackground } from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { MessageName } from '@refly/common-types';
import { safeStringifyJSON } from '@refly-packages/utils/parse';

// 添加一个全局loading状态管理函数
let loadingCount = 0;
const setGlobalLoading = (isLoading: boolean) => {
  if (isLoading) {
    loadingCount++;
  } else {
    loadingCount = Math.max(0, loadingCount - 1);
  }
  // 这里可以触发UI更新,例如:
  dispatchEvent(new CustomEvent('globalLoadingChange', { detail: { isLoading: loadingCount > 0 } }));
};

createClient({ baseUrl: getServerOrigin() + '/v1' });

client.interceptors.request.use((request) => {
  // setGlobalLoading(true);
  const token = getAuthTokenFromCookie();
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
});

client.interceptors.response.use((response) => {
  // setGlobalLoading(false);
  return response;
});

const wrapFunctions = (module: any) => {
  const wrappedModule: any = {};

  for (const key of Reflect.ownKeys(module)) {
    const origMethod = module[key];

    const runtime = getRuntime() || '';
    if (runtime.includes('extension') && typeof origMethod === 'function') {
      wrappedModule[key] = async function (...args: unknown[]) {
        console.log(`Calling function ${String(key)} with arguments: ${safeStringifyJSON(args)}`);

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
