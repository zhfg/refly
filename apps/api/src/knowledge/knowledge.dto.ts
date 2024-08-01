import {
  Collection as CollectionModel,
  Resource as ResourceModel,
  Note as NoteModel,
} from '@prisma/client';
import { UpsertResourceRequest, Collection, Resource, Note } from '@refly/openapi-schema';
import { omit } from '@/utils';
import { pick } from 'lodash';

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
    resources: coll.resources?.map((resource) => resourcePO2DTO(resource)),
  };
};

export const resourcePO2DTO = (resource: ResourceModel, showFullContent?: boolean): Resource => {
  if (!resource) {
    return null;
  }
  const res: Resource = {
    ...omit(resource, ['id', 'uid', 'content', 'deletedAt']),
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

export const notePO2DTO = (note: NoteModel, showFullContent?: boolean): Note => {
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
