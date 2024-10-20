import {
  Collection as CollectionModel,
  Resource as ResourceModel,
  Canvas as CanvasModel,
  LabelInstance,
} from '@prisma/client';
import {
  Collection,
  Resource,
  Canvas,
  ResourceType,
  IndexStatus,
} from '@refly-packages/openapi-schema';
import { pick } from '@/utils';

export type FinalizeResourceParam = {
  resourceId: string;
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

export const canvasPO2DTO = (canvas: CanvasModel & { content?: string }): Canvas => {
  if (!canvas) {
    return null;
  }
  const res: Canvas = {
    ...pick(canvas, ['canvasId', 'title', 'content', 'contentPreview', 'isPublic', 'readOnly']),
    createdAt: canvas.createdAt.toJSON(),
    updatedAt: canvas.updatedAt.toJSON(),
  };
  return res;
};
