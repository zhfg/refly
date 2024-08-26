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
import { omit } from '@/utils';
import { pick } from 'lodash';

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
    ...omit(coll, ['id', 'uid', 'deletedAt']),
    createdAt: coll.createdAt.toJSON(),
    updatedAt: coll.updatedAt.toJSON(),
    resources: coll.resources?.map((resource) => resourcePO2DTO(resource)),
  };
};

export const resourcePO2DTO = (
  resource: ResourceModel & { collections?: CollectionModel[]; labels?: LabelInstance[] },
  showFullContent?: boolean,
): Resource => {
  if (!resource) {
    return null;
  }
  const res: Resource = {
    ...pick(resource, ['resourceId', 'title', 'isPublic', 'readOnly']),
    resourceType: resource.resourceType as ResourceType,
    indexStatus: resource.indexStatus as IndexStatus,
    collections: resource.collections?.map((coll) => collectionPO2DTO(coll)),
    contentPreview: resource.content ? resource.content.slice(0, 250) + '...' : '',
    data: JSON.parse(resource.meta),
    createdAt: resource.createdAt.toJSON(),
    updatedAt: resource.updatedAt.toJSON(),
  };
  if (showFullContent) {
    res.content = resource.content;
  }
  return res;
};

export const notePO2DTO = (
  note: NoteModel & { labels?: LabelInstance[] },
  showFullContent?: boolean,
): Note => {
  if (!note) {
    return null;
  }
  const res: Note = {
    ...pick(note, ['noteId', 'title', 'content', 'isPublic', 'readOnly']),
    createdAt: note.createdAt.toJSON(),
    updatedAt: note.updatedAt.toJSON(),
  };
  if (showFullContent) {
    res.content = note.content;
  }
  return res;
};
