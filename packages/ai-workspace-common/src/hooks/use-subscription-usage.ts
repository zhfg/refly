import { useGetSubscriptionUsage } from '@refly-packages/ai-workspace-common/queries/queries';
import { subscriptionEnabled } from '@refly-packages/ai-workspace-common/utils/env';

export const useSubscriptionUsage = () => {
  const {
    data,
    isLoading: isUsageLoading,
    refetch,
  } = useGetSubscriptionUsage({}, [], {
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
    staleTime: 15 * 1000,
    gcTime: 15 * 1000,
    enabled: subscriptionEnabled,
  });
  const { token, storage, fileParsing } = data?.data ?? {};

  const refetchUsage = () =>
    setTimeout(async () => {
      try {
        await refetch();
      } catch (error) {
        console.error('Failed to refetch usage:', error);
      }
    }, 2000);

  return {
    tokenUsage: token,
    storageUsage: storage,
    fileParsingUsage: fileParsing,
    isUsageLoading,
    refetchUsage,
  };
};
