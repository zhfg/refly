import { AuthenticationExpiredError } from '@refly/errors';
import getClient, { extractBaseResp } from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { getLocale } from '@refly-packages/ai-workspace-common/utils/locale';
import { showErrorNotification } from '@refly-packages/ai-workspace-common/utils/notification';
import { logout } from '@refly-packages/ai-workspace-common/hooks/use-logout';

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;
const requestQueue: Array<{
  resolve: (value: Response) => void;
  reject: (error: unknown) => void;
  failedRequest: Request;
}> = [];

export const refreshToken = async (): Promise<boolean> => {
  if (isRefreshing) {
    return refreshPromise!;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const { response, error } = await getClient().refreshToken();

      if (error || response?.status === 401) {
        return false;
      }
      return true;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const refreshTokenAndRetry = async (failedRequest: Request): Promise<Response> => {
  if (requestQueue.length > 0) {
    return new Promise<Response>((resolve, reject) => {
      requestQueue.push({ resolve, reject, failedRequest });
    });
  }

  const isRefreshed = await refreshToken();
  if (!isRefreshed) {
    // Clear queue and reject all pending requests
    while (requestQueue.length > 0) {
      const { reject } = requestQueue.shift()!;
      reject(new AuthenticationExpiredError());
    }
    throw new AuthenticationExpiredError();
  }

  // Process the current request
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
};

export const responseInterceptorWithTokenRefresh = async (response: Response, request: Request) => {
  if (request.url.includes('/v1/auth/refreshToken')) {
    return response;
  }

  if (response.status === 401) {
    try {
      const retryResponse = await refreshTokenAndRetry(request);
      return retryResponse;
    } catch (error) {
      if (error instanceof AuthenticationExpiredError) {
        await logout();
      }
      return response;
    }
  }

  const error = await extractBaseResp(response);
  if (!error.success) {
    showErrorNotification(error, getLocale());
  }
  return response;
};
