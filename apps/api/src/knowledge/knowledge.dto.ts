import {
  Resource as ResourceModel,
  Canvas as CanvasModel,
  Project as ProjectModel,
  Conversation as ConversationModel,
} from '@prisma/client';
import {
  Resource,
  Canvas,
  ResourceType,
  IndexStatus,
  Project,
  ReferenceType,
} from '@refly-packages/openapi-schema';
import { pick } from '@/utils';
import { conversationPO2DTO } from '@/conversation/conversation.dto';

export type FinalizeResourceParam = {
  resourceId: string;
  uid: string;
};

export const projectPO2DTO = (
  project: ProjectModel & {
    resources?: ResourceModel[];
    canvases?: CanvasModel[];
    conversations?: ConversationModel[];
  },
): Project => {
  return {
    ...pick(project, ['projectId', 'title', 'description']),
    createdAt: project.createdAt.toJSON(),
    updatedAt: project.updatedAt.toJSON(),
    resources: project.resources?.map((resource) => resourcePO2DTO(resource)),
    canvases: project.canvases?.map((canvas) => canvasPO2DTO(canvas)),
    conversations: project.conversations?.map((conversation) => conversationPO2DTO(conversation)),
  };
};

export const resourcePO2DTO = (
  resource: ResourceModel & {
    content?: string;
    projects?: ProjectModel[];
    canvases?: CanvasModel[];
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
    referredByCanvases: resource.canvases?.map((canvas) => canvasPO2DTO(canvas)),
  };
  return res;
};

export const canvasPO2DTO = (
  canvas: CanvasModel & {
    content?: string;
    referredByCanvases?: CanvasModel[];
    referenceResources?: ResourceModel[];
    referenceCanvases?: CanvasModel[];
  },
): Canvas => {
  if (!canvas) {
    return null;
  }
  const res: Canvas = {
    ...pick(canvas, ['canvasId', 'title', 'content', 'contentPreview', 'isPublic', 'readOnly']),
    createdAt: canvas.createdAt.toJSON(),
    updatedAt: canvas.updatedAt.toJSON(),
    referredByCanvases: canvas.referredByCanvases?.map((canvas) => canvasPO2DTO(canvas)),
    references: [
      ...(canvas.referenceResources?.map((resource) => ({
        referenceId: resource.resourceId,
        referenceType: 'resource' as ReferenceType,
        title: resource.title,
        url: JSON.parse(resource.meta || '{}').url,
      })) || []),
      ...(canvas.referenceCanvases?.map((canvas) => ({
        referenceId: canvas.canvasId,
        referenceType: 'canvas' as ReferenceType,
        title: canvas.title,
      })) || []),
    ],
  };
  return res;
};
