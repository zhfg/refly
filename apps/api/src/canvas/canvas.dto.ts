import { Canvas as CanvasModel } from '@prisma/client';
import { Canvas } from '@refly-packages/openapi-schema';

export function canvasPO2DTO(canvas: CanvasModel): Canvas {
  return {
    ...canvas,
    createdAt: canvas.createdAt.toISOString(),
    updatedAt: canvas.updatedAt.toISOString(),
  };
}
