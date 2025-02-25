import { StorageUsageMeter } from '@refly-packages/openapi-schema';

export function getAvailableFileCount(storageUsage: StorageUsageMeter) {
  if (!storageUsage || storageUsage.fileCountQuota < 0) {
    return Number.POSITIVE_INFINITY;
  }
  return storageUsage.fileCountQuota - (storageUsage.fileCountUsed ?? 0);
}
