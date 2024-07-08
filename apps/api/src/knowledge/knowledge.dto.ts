import { Collection as CollectionModel, Resource as ResourceModel } from '@prisma/client';
import { UpsertResourceRequest, Collection, Resource } from '@refly/openapi-schema';
import { omit } from '../utils';

export type FinalizeResourceParam = UpsertResourceRequest & {
  uid: string;
};

export const collectionPO2DTO = (
  coll: CollectionModel & { resources?: ResourceModel[] },
): Collection => {
  if (!coll) {
    return null;
  }
  return {
    ...omit(coll, ['id', 'uid', 'deletedAt']),
    createdAt: coll.createdAt.toJSON(),
    updatedAt: coll.updatedAt.toJSON(),
    resources: coll.resources?.map(resourcePO2DTO),
  };
};

export const resourcePO2DTO = (resource: ResourceModel): Resource => {
  if (!resource) {
    return null;
  }
  return {
    ...omit(resource, ['id', 'uid', 'stateStorageKey', 'deletedAt']),
    data: JSON.parse(resource.meta),
    collabEnabled: !!resource.stateStorageKey,
    createdAt: resource.createdAt.toJSON(),
    updatedAt: resource.updatedAt.toJSON(),
  };
};
