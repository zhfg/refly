import {
  Collection as CollectionModel,
  Resource as ResourceModel,
  Note as NoteModel,
  LabelInstance,
} from '@prisma/client';
import {
  UpsertResourceRequest,
  Collection,
  Resource,
  Note,
  ResourceType,
  IndexStatus,
} from '@refly/openapi-schema';
import { pick } from '@/utils';

export type FinalizeResourceParam = UpsertResourceRequest & {
  uid: string;
};

export const collectionPO2DTO = (
  coll: CollectionModel & { resources?: ResourceModel[]; labels?: LabelInstance[] },
): Collection => {
  if (!coll) {
    return null;
  }
  return {
    ...pick(coll, ['collectionId', 'title', 'description', 'isPublic']),
    createdAt: coll.createdAt.toJSON(),
    updatedAt: coll.updatedAt.toJSON(),
    resources: coll.resources?.map((resource) => resourcePO2DTO(resource)),
  };
};

export const resourcePO2DTO = (
  resource: ResourceModel & {
    content?: string;
    collections?: CollectionModel[];
  },
): Resource => {
  if (!resource) {
    return null;
  }
  const res: Resource = {
    ...pick(resource, ['resourceId', 'title', 'isPublic', 'readOnly', 'content', 'contentPreview']),
    resourceType: resource.resourceType as ResourceType,
    indexStatus: resource.indexStatus as IndexStatus,
    collections: resource.collections?.map((coll) => collectionPO2DTO(coll)),
    data: JSON.parse(resource.meta),
    createdAt: resource.createdAt.toJSON(),
    updatedAt: resource.updatedAt.toJSON(),
  };
  return res;
};

export const notePO2DTO = (note: NoteModel & { content?: string }): Note => {
  if (!note) {
    return null;
  }
  const res: Note = {
    ...pick(note, ['noteId', 'title', 'content', 'contentPreview', 'isPublic', 'readOnly']),
    createdAt: note.createdAt.toJSON(),
    updatedAt: note.updatedAt.toJSON(),
  };
  return res;
};
