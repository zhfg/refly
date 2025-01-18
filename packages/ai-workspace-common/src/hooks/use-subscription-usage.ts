import { useGetSubscriptionUsage } from '@refly-packages/ai-workspace-common/queries/queries';

export const useSubscriptionUsage = () => {
  const {
    data,
    isLoading: isUsageLoading,
    refetch: refetchUsage,
  } = useGetSubscriptionUsage({}, [], {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
    gcTime: 60 * 1000, // Cache for 1 minute
  });
  const { token, storage } = data?.data ?? {};

  return { tokenUsage: token, storageUsage: storage, isUsageLoading, refetchUsage };
};
