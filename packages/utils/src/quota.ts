import { StorageUsageMeter } from '@refly-packages/openapi-schema';

export const getAvailableFileQuota = (meter: StorageUsageMeter) => {
  if (!meter) {
    return 0;
  }
  if (meter.fileCountQuota < 0) {
    return Number.POSITIVE_INFINITY;
  }
  return meter.fileCountQuota - (meter.fileCountUsed ?? 0);
};
