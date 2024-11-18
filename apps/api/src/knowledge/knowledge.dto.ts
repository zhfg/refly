import {
  Resource as ResourceModel,
  Document as DocumentModel,
  Project as ProjectModel,
  Reference as ReferenceModel,
} from '@prisma/client';
import {
  Resource,
  ResourceType,
  IndexStatus,
  Project,
  Reference,
  ReferenceType,
  ReferenceMeta,
  Document,
} from '@refly-packages/openapi-schema';
import { pick } from '@/utils';

export type FinalizeResourceParam = {
  resourceId: string;
  uid: string;
};

export const projectPO2DTO = (project: ProjectModel): Project => {
  return {
    ...pick(project, ['projectId', 'title', 'description', 'shareCode']),
    createdAt: project.createdAt.toJSON(),
    updatedAt: project.updatedAt.toJSON(),
  };
};

export const resourcePO2DTO = (
  resource: ResourceModel & {
    order?: number;
    content?: string;
    projectIds?: string[];
  },
): Resource => {
  if (!resource) {
    return null;
  }
  return {
    ...pick(resource, ['resourceId', 'title', 'content', 'contentPreview', 'order', 'projectIds']),
    resourceType: resource.resourceType as ResourceType,
    indexStatus: resource.indexStatus as IndexStatus,
    storageSize: resource.storageSize.toString(),
    vectorSize: resource.vectorSize.toString(),
    data: JSON.parse(resource.meta),
    createdAt: resource.createdAt.toJSON(),
    updatedAt: resource.updatedAt.toJSON(),
  };
};

export const documentPO2DTO = (
  doc: DocumentModel & {
    content?: string;
  },
): Document => {
  if (!doc) {
    return null;
  }
  const res: Document = {
    ...pick(doc, ['docId', 'title', 'content', 'contentPreview', 'shareCode', 'readOnly']),
    createdAt: doc.createdAt.toJSON(),
    updatedAt: doc.updatedAt.toJSON(),
  };
  return res;
};

export interface ExtendedReferenceModel extends ReferenceModel {
  sourceMeta?: ReferenceMeta;
  targetMeta?: ReferenceMeta;
}

export const referencePO2DTO = (reference: ExtendedReferenceModel): Reference => {
  return {
    ...pick(reference, ['referenceId', 'sourceId', 'targetId', 'sourceMeta', 'targetMeta']),
    sourceType: reference.sourceType as ReferenceType,
    targetType: reference.targetType as ReferenceType,
  };
};
