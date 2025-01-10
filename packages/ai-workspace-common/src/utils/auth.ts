import { UnknownError } from '@refly/errors';

import { getServerOrigin } from '@refly-packages/utils/url';
import { AuthenticationExpiredError } from '@refly/errors';
import { extractBaseResp } from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { getLocale } from '@refly-packages/ai-workspace-common/utils/locale';
import { showErrorNotification } from '@refly-packages/ai-workspace-common/utils/notification';
import { logout } from '@refly-packages/ai-workspace-common/hooks/use-logout';

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;
const requestQueue: Array<{
  resolve: (value: Response) => void;
  reject: (error: unknown) => void;
  failedRequest: Request;
}> = [];

export const refreshTokenAndRetry = async (failedRequest: Request): Promise<Response> => {
  // If there's already a refresh in progress, queue this request
  if (isRefreshing) {
    return new Promise<Response>((resolve, reject) => {
      requestQueue.push({ resolve, reject, failedRequest });
    });
  }

  try {
    isRefreshing = true;
    refreshPromise = (async () => {
      const response = await fetch(`${getServerOrigin()}/v1/auth/refreshToken`, {
        method: 'POST',
        credentials: 'include',
      });

      console.log('refreshTokenAndRetry response', response);

      // Refresh token returns 401 again, which means the refresh token is expired
      if (response.status === 401) {
        throw new AuthenticationExpiredError();
      }

      if (!response.ok) {
        throw new UnknownError();
      }
    })();

    // Wait for the refresh token request to complete
    await refreshPromise;

    // Process all queued requests
    const retryResponse = await fetch(failedRequest);

    // Retry all queued requests
    while (requestQueue.length > 0) {
      const { resolve, reject, failedRequest: queuedRequest } = requestQueue.shift()!;
      try {
        const retriedResponse = await fetch(queuedRequest);
        resolve(retriedResponse);
      } catch (error) {
        reject(error);
      }
    }

    return retryResponse;
  } catch (error) {
    // If refresh fails, reject all queued requests
    while (requestQueue.length > 0) {
      const { reject } = requestQueue.shift()!;
      reject(error);
    }
    throw error;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
};

export const responseInterceptorWithTokenRefresh = async (response: Response, request: Request) => {
  if (response.status === 401) {
    try {
      const retryResponse = await refreshTokenAndRetry(request);
      return retryResponse;
    } catch (error) {
      if (error instanceof AuthenticationExpiredError) {
        await logout();
      } else {
        throw new UnknownError();
      }
    }
  }

  const error = await extractBaseResp(response);
  if (!error.success) {
    showErrorNotification(error, getLocale());
  }
  return response;
};
