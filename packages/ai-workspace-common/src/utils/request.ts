import { QueryClient } from '@tanstack/react-query';
import { getServerOrigin } from '@refly/utils/url';
import { safeParseJSON } from '@refly/utils/parse';
import { client } from '@refly-packages/ai-workspace-common/requests';
import { extractBaseResp, showErrorNotification } from '../requests/proxiedRequest';

const COOKIE_TOKEN_FIELD = '_refly_ai_sid';

export function getAuthTokenFromCookie() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${COOKIE_TOKEN_FIELD}=`) || [];
  return parts.length === 2 ? parts.pop()!.split(';').shift() : '';
}

client.setConfig({
  baseUrl: getServerOrigin() + '/v1',
  credentials: 'include',
  throwOnError: false, // If you want to handle errors on `onError` callback of `useQuery` and `useMutation`, set this to `true`
});

client.interceptors.request.use((request) => {
  // const token = getAuthTokenFromCookie();
  // if (token) {
  //   request.headers.set('Authorization', `Bearer ${token}`);
  // }
  return request;
});

const getLocale = () => {
  const settings = safeParseJSON(localStorage.getItem('refly-local-settings'));
  return settings?.uiLocale || 'en';
};

client.interceptors.response.use(async (response) => {
  const error = await extractBaseResp(response);
  if (!error.success) {
    showErrorNotification(error, getLocale());
  }
  return response;
});

export const queryClient = new QueryClient();
