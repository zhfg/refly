import {
  Canvas as CanvasModel,
  CanvasTemplateCategory as CanvasTemplateCategoryModel,
  CanvasTemplate as CanvasTemplateModel,
} from '@prisma/client';
import {
  Canvas,
  CanvasTemplate,
  CanvasTemplateCategory,
  Entity,
} from '@refly-packages/openapi-schema';
import { pick } from '@/utils';

export interface SyncCanvasEntityJobData {
  canvasId: string;
}

export interface DeleteCanvasNodesJobData {
  entities: Entity[];
}

export interface AutoNameCanvasJobData {
  uid: string;
  canvasId: string;
}

export interface DuplicateCanvasJobData {
  uid: string;
  sourceCanvasId: string;
  targetCanvasId: string;
  title?: string;
  duplicateEntities?: boolean;
}

export function canvasPO2DTO(canvas: CanvasModel): Canvas {
  return {
    ...pick(canvas, ['canvasId', 'title']),
    createdAt: canvas.createdAt.toJSON(),
    updatedAt: canvas.updatedAt.toJSON(),
  };
}

export function canvasTemplatePO2DTO(
  template: CanvasTemplateModel & { category?: CanvasTemplateCategoryModel },
): CanvasTemplate {
  return {
    ...pick(template, [
      'title',
      'uid',
      'version',
      'templateId',
      'categoryId',
      'originCanvasId',
      'shareUser',
      'description',
      'language',
    ]),
    createdAt: template.createdAt.toJSON(),
    updatedAt: template.updatedAt.toJSON(),
    shareUser: JSON.parse(template.shareUser || '{}'),
    category: template.category ? canvasTemplateCategoryPO2DTO(template.category) : undefined,
  };
}

export function canvasTemplateCategoryPO2DTO(
  category: CanvasTemplateCategoryModel,
): CanvasTemplateCategory {
  return {
    ...pick(category, ['categoryId', 'name', 'labelDict', 'descriptionDict']),
    labelDict: JSON.parse(category.labelDict || '{}'),
    descriptionDict: JSON.parse(category.descriptionDict || '{}'),
  };
}
