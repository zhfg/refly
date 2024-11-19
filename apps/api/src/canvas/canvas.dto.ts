import { Canvas as CanvasModel } from '@prisma/client';
import { Canvas } from '@refly-packages/openapi-schema';
import { pick } from '@/utils';

export function canvasPO2DTO(canvas: CanvasModel): Canvas {
  return {
    ...pick(canvas, ['canvasId', 'title', 'shareCode']),
    createdAt: canvas.createdAt.toJSON(),
    updatedAt: canvas.updatedAt.toJSON(),
  };
}
