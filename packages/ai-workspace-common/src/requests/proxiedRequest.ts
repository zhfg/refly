import { client, BaseResponse } from '@refly/openapi-schema';
import * as requestModule from '@refly/openapi-schema';

import { getRuntime, serverOrigin } from '@refly-packages/ai-workspace-common/utils/env';
import { ConnectionError, OperationTooFrequent, UnknownError } from '@refly/errors';
import { sendToBackground } from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { MessageName } from '@refly/common-types';
import { safeStringifyJSON } from '@refly-packages/utils/parse';
import { responseInterceptorWithTokenRefresh } from '@refly-packages/ai-workspace-common/utils/auth';
import { getLocale } from '@refly-packages/ai-workspace-common/utils/locale';
import { showErrorNotification } from '@refly-packages/ai-workspace-common/utils/notification';

// Create a WeakMap to store cloned requests
const requestCache = new WeakMap<Request, Request>();

// Function to cache a cloned request
const cacheClonedRequest = (originalRequest: Request, clonedRequest: Request) => {
  requestCache.set(originalRequest, clonedRequest);
};

// Function to get and clear cached request
const getAndClearCachedRequest = (originalRequest: Request): Request | undefined => {
  const cachedRequest = requestCache.get(originalRequest);
  if (cachedRequest) {
    requestCache.delete(originalRequest);
  }
  return cachedRequest;
};

client.setConfig({ baseUrl: `${serverOrigin}/v1`, credentials: 'include' });

export interface CheckResponseResult {
  isError: boolean;
  baseResponse?: BaseResponse;
}

export const extractBaseResp = async (response: Response): Promise<BaseResponse> => {
  if (!response.ok) {
    return response.status === 429
      ? {
          success: false,
          errCode: new OperationTooFrequent().code,
        }
      : {
          success: false,
          errCode: new UnknownError().code,
        };
  }

  if (response.headers.get('Content-Type')?.includes('application/json')) {
    const clonedResponse = response.clone();
    return await clonedResponse.json();
  }

  return { success: true };
};

client.interceptors.request.use(async (request) => {
  // Clone and cache the request before processing
  // Since we may resend the request after refreshing access tokens
  const clonedRequest = request.clone();
  cacheClonedRequest(request, clonedRequest);

  return request;
});

client.interceptors.response.use(async (response, request) => {
  // Get the cached request and clear it from cache
  const cachedRequest = getAndClearCachedRequest(request);
  return responseInterceptorWithTokenRefresh(response, cachedRequest ?? request);
});

const wrapFunctions = (module: any) => {
  const wrappedModule: any = {};

  for (const key of Reflect.ownKeys(module)) {
    const origMethod = module[key];

    const runtime = getRuntime() || '';
    if (runtime.includes('extension') && typeof origMethod === 'function') {
      wrappedModule[key] = async (...args: unknown[]) => {
        console.log(`Calling function ${String(key)} with arguments: ${safeStringifyJSON(args)}`);

        try {
          return await sendToBackground({
            name: String(key) as MessageName,
            type: 'apiRequest',
            source: getRuntime(),
            target: module,
            args,
          });
        } catch (err) {
          const errResp = {
            success: false,
            errCode: new ConnectionError(err).code,
          };
          showErrorNotification(errResp, getLocale());
          return errResp;
        }
      };
    } else {
      wrappedModule[key] = async (...args: unknown[]) => {
        try {
          return await origMethod(...args);
        } catch (err) {
          const errResp = {
            success: false,
            errCode: new ConnectionError(err).code,
          };
          showErrorNotification(errResp, getLocale());
          return errResp;
        }
      };
    }
  }

  return wrappedModule as typeof requestModule;
};

const wrappedRequestModule = () => {
  return wrapFunctions(requestModule);
};

export default wrappedRequestModule;
