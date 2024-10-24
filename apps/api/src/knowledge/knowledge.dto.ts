import {
  Resource as ResourceModel,
  Canvas as CanvasModel,
  Project as ProjectModel,
  Reference as ReferenceModel,
} from '@prisma/client';
import {
  Resource,
  Canvas,
  ResourceType,
  IndexStatus,
  Project,
  Reference,
  ReferenceType,
} from '@refly-packages/openapi-schema';
import { pick } from '@/utils';

export type FinalizeResourceParam = {
  resourceId: string;
  uid: string;
};

export const projectPO2DTO = (project: ProjectModel): Project => {
  return {
    ...pick(project, ['projectId', 'title', 'description']),
    createdAt: project.createdAt.toJSON(),
    updatedAt: project.updatedAt.toJSON(),
  };
};

export const resourcePO2DTO = (
  resource: ResourceModel & {
    content?: string;
    projects?: ProjectModel[];
  },
): Resource => {
  if (!resource) {
    return null;
  }
  const res: Resource = {
    ...pick(resource, ['resourceId', 'title', 'readOnly', 'content', 'contentPreview']),
    resourceType: resource.resourceType as ResourceType,
    indexStatus: resource.indexStatus as IndexStatus,
    data: JSON.parse(resource.meta),
    createdAt: resource.createdAt.toJSON(),
    updatedAt: resource.updatedAt.toJSON(),
    projects: resource.projects?.map((project) => projectPO2DTO(project)),
  };
  return res;
};

export const canvasPO2DTO = (
  canvas: CanvasModel & {
    content?: string;
  },
): Canvas => {
  if (!canvas) {
    return null;
  }
  const res: Canvas = {
    ...pick(canvas, [
      'canvasId',
      'projectId',
      'title',
      'content',
      'contentPreview',
      'isPublic',
      'readOnly',
    ]),
    createdAt: canvas.createdAt.toJSON(),
    updatedAt: canvas.updatedAt.toJSON(),
  };
  return res;
};

export const referencePO2DTO = (reference: ReferenceModel): Reference => {
  return {
    ...pick(reference, ['referenceId', 'sourceId', 'sourceTitle', 'targetId', 'targetTitle']),
    sourceType: reference.sourceType as ReferenceType,
    targetType: reference.targetType as ReferenceType,
    sourceMeta: JSON.parse(reference.sourceMeta),
    targetMeta: JSON.parse(reference.targetMeta),
  };
};
