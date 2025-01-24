import { QueryClient } from '@tanstack/react-query';
import { getServerOrigin } from '@refly/utils/url';
import { client } from '@refly-packages/ai-workspace-common/requests';
import { responseInterceptorWithTokenRefresh } from '@refly-packages/ai-workspace-common/utils/auth';

client.setConfig({
  baseUrl: `${getServerOrigin()}/v1`,
  credentials: 'include',
  throwOnError: false, // If you want to handle errors on `onError` callback of `useQuery` and `useMutation`, set this to `true`
});

client.interceptors.response.use(async (response, request) => {
  return responseInterceptorWithTokenRefresh(response, request);
});

export const queryClient = new QueryClient();
