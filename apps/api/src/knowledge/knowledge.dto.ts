import { UpsertResourceRequest } from '@refly/openapi-schema';

export type FinalizeResourceParam = UpsertResourceRequest & {
  userId: number;
};
